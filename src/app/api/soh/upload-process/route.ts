
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, writeBatch, Timestamp, updateDoc } from 'firebase/firestore';
import type { User, SOHDataReference, StockItem, SOHDataReferenceStatus } from '@/lib/types';
import { parse } from 'cookie';
import * as xlsx from 'xlsx';

async function getUserFromSession(req: NextRequest): Promise<User | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  const sessionCookie = cookies['stockflow-session'];
  if (!sessionCookie) return null;

  try {
    const userData = JSON.parse(sessionCookie) as User;
    if (userData && userData.id && userData.email) {
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing session cookie in API (soh/upload-process):", error);
    return null;
  }
}

// Interface matching the expected structure of a row from XLSX
interface ExpectedRow {
  sku: string;
  sku_description: string;
  qty_on_hand: number;
  form_no?: string | null;
  storerkey?: string;
  loc?: string;
  lot?: string;
  item_id?: string;
  qty_allocated?: number;
  qty_available?: number;
  lottable01?: string;
  project_scope?: string;
  lottable10?: string;
  project_id?: string;
  wbs_element?: string;
  skugrp?: string;
  received_date?: string | number; // Excel dates can be numbers (serial) or strings
  huid?: string;
  owner_id?: string;
  stdcube?: number;
}


export async function POST(req: NextRequest) {
  const currentUser = await getUserFromSession(req);
  if (!currentUser) {
    return NextResponse.json({ message: 'Unauthorized: User session not found.' }, { status: 401 });
  }

  const authorizedRoles: User['role'][] = ['superuser', 'admin_doc_control'];
  if (!authorizedRoles.includes(currentUser.role)) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to upload SOH data.' }, { status: 403 });
  }

  let sohReferenceDocId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const stoProjectId = formData.get('stoProjectId') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }
    if (!stoProjectId) {
      return NextResponse.json({ message: 'STO Project ID is required.' }, { status: 400 });
    }
    if (currentUser.role !== 'superuser') {
        const projectCookie = req.cookies.get('stockflow-selected-project');
        if(!projectCookie || JSON.parse(projectCookie.value).id !== stoProjectId){
            return NextResponse.json({ message: 'Forbidden: Admins can only upload to their selected project.' }, { status: 403 });
        }
    }

    const initialSohRefData: Omit<SOHDataReference, 'id'> = {
      filename: file.name, // Storing original filename for reference if needed
      originalFilename: file.name,
      uploadedBy: currentUser.email,
      uploadedAt: Timestamp.now().toDate().toISOString(),
      rowCount: 0,
      status: 'Processing' as SOHDataReferenceStatus,
      stoProjectId: stoProjectId,
      contentType: file.type,
      size: file.size,
    };
    const sohReferenceRef = await addDoc(collection(db, 'soh_data_references'), initialSohRefData);
    sohReferenceDocId = sohReferenceRef.id;

    const bytes = await file.arrayBuffer();
    const workbook = xlsx.read(bytes, { type: 'array', cellDates: true }); // cellDates: true attempts to parse dates
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<ExpectedRow>(worksheet, { defval: undefined }); // Use undefined for defval

    if (!jsonData || jsonData.length === 0) {
      await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage: 'File is empty or has no data in the first sheet.', rowCount: 0, processedAt: Timestamp.now().toDate().toISOString() });
      return NextResponse.json({ message: 'File is empty or has no data.' }, { status: 400 });
    }
    
    const headers = xlsx.utils.sheet_to_json<any>(worksheet, { header: 1 })[0] as string[];
    const requiredHeaders = ['sku', 'sku_description', 'qty_on_hand']; 
    for (const header of requiredHeaders) {
        if (!headers.map(h => String(h).toLowerCase().trim()).includes(header.toLowerCase().trim())) {
            const errorMessage = `Missing required header: ${header}. Please ensure your Excel file includes columns: ${requiredHeaders.join(', ')}. Check for exact spelling and case.`;
            await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage, rowCount: 0, processedAt: Timestamp.now().toDate().toISOString() });
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }
    }

    await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'Storing' as SOHDataReferenceStatus });
    
    let currentBatch = writeBatch(db);
    let operationsInBatch = 0;
    const MAX_OPERATIONS_PER_BATCH = 490; // Firestore batch limit is 500 operations
    let validRowCount = 0;
    const validationErrors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Basic validation for required fields
      if (!row.sku || String(row.sku).trim() === '') {
        validationErrors.push(`Row ${i + 2}: Column 'sku' is missing or empty.`);
        continue;
      }
      if (row.qty_on_hand === undefined || typeof row.qty_on_hand !== 'number' || isNaN(row.qty_on_hand)) {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.sku}): Column 'qty_on_hand' is missing or not a valid number.`);
        continue;
      }
       if (!row.sku_description || String(row.sku_description).trim() === '') {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.sku}): Column 'sku_description' is missing or empty.`);
        continue;
      }

      let receivedDateStr: string | undefined = undefined;
      if (row.received_date) {
        if (row.received_date instanceof Date) {
          receivedDateStr = row.received_date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (typeof row.received_date === 'string') {
          // Attempt to parse if it's a string that looks like a date, otherwise keep as is or validate format
          // For simplicity, we'll assume if it's a string, it's in a usable format or just store it.
          // More robust parsing/validation can be added here.
          const parsedDate = new Date(row.received_date);
          if (!isNaN(parsedDate.getTime())) {
             receivedDateStr = parsedDate.toISOString().split('T')[0];
          } else {
             receivedDateStr = row.received_date; // store as is if not parseable
          }
        } else if (typeof row.received_date === 'number') { // Excel date serial
             // xlsx's cellDates:true should handle this, but as a fallback:
            try {
                const jsDate = xlsx.SSF.parse_date_code(row.received_date);
                receivedDateStr = `${jsDate.y}-${String(jsDate.m).padStart(2,'0')}-${String(jsDate.d).padStart(2,'0')}`;
            } catch(e){
                validationErrors.push(`Row ${i+2} (SKU: ${row.sku}): Invalid date format in 'received_date'.`);
            }
        }
      }


      const stockItemData: Omit<StockItem, 'id'> = {
        sku: String(row.sku).trim(),
        sku_description: String(row.sku_description).trim(),
        qty_on_hand: Number(row.qty_on_hand),
        
        form_no: row.form_no === undefined || String(row.form_no).trim() === '' ? null : String(row.form_no).trim(),
        storerkey: row.storerkey ? String(row.storerkey).trim() : undefined,
        loc: row.loc ? String(row.loc).trim() : undefined,
        lot: row.lot ? String(row.lot).trim() : undefined,
        item_id: row.item_id ? String(row.item_id).trim() : undefined,
        qty_allocated: typeof row.qty_allocated === 'number' ? Number(row.qty_allocated) : undefined,
        qty_available: typeof row.qty_available === 'number' ? Number(row.qty_available) : undefined,
        lottable01: row.lottable01 ? String(row.lottable01).trim() : undefined,
        project_scope: row.project_scope ? String(row.project_scope).trim() : undefined,
        lottable10: row.lottable10 ? String(row.lottable10).trim() : undefined,
        project_id: row.project_id ? String(row.project_id).trim() : undefined,
        wbs_element: row.wbs_element ? String(row.wbs_element).trim() : undefined,
        skugrp: row.skugrp ? String(row.skugrp).trim() : undefined,
        received_date: receivedDateStr,
        huid: row.huid ? String(row.huid).trim() : undefined,
        owner_id: row.owner_id ? String(row.owner_id).trim() : undefined,
        stdcube: typeof row.stdcube === 'number' ? Number(row.stdcube) : undefined,

        stoProjectId: stoProjectId,
        sohDataReferenceId: sohReferenceDocId,
      };
      
      const stockItemRef = doc(collection(db, 'stock_items'));
      currentBatch.set(stockItemRef, stockItemData);
      operationsInBatch++;
      validRowCount++;

      if (operationsInBatch >= MAX_OPERATIONS_PER_BATCH) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationsInBatch = 0;
      }
    }
    
    if (operationsInBatch > 0) {
         await currentBatch.commit();
    }

    if (validationErrors.length > 0 && validRowCount === 0) {
        await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { 
            status: 'ValidationError' as SOHDataReferenceStatus, 
            errorMessage: `No valid data found. ${validationErrors.length} rows had issues. First few errors: ${validationErrors.slice(0,5).join('; ')}`,
            processedAt: Timestamp.now().toDate().toISOString(),
            rowCount: 0,
        });
        return NextResponse.json({ message: `Upload failed: No valid data found. ${validationErrors.join('; ')}` }, { status: 400 });
    }
    
    const finalStatus: SOHDataReferenceStatus = 'Completed';
    const finalErrorMessage = validationErrors.length > 0 ? `Completed with ${validationErrors.length} row error(s). First few: ${validationErrors.slice(0,3).join('; ')}` : null;

    await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), {
      status: finalStatus,
      rowCount: validRowCount,
      processedAt: Timestamp.now().toDate().toISOString(),
      errorMessage: finalErrorMessage, // This can be null
    });

    const successMessage = `File processed. ${validRowCount} items stored for project ${stoProjectId}. ${validationErrors.length > 0 ? `${validationErrors.length} rows had issues.` : '' }`;
    return NextResponse.json({ 
        message: successMessage, 
        sohDataReferenceId: sohReferenceDocId, 
        itemsProcessed: validRowCount,
        errors: validationErrors.length > 0 ? validationErrors : undefined
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing SOH upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    if (sohReferenceDocId) {
        try {
            await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { 
                status: 'SystemError' as SOHDataReferenceStatus, 
                errorMessage: `System error during processing: ${String(errorMessage).substring(0, 1000)}`,
                processedAt: Timestamp.now().toDate().toISOString(),
                rowCount: 0,
            });
        } catch (updateError) {
            console.error('Failed to update SOH reference on error:', updateError);
        }
    }
    return NextResponse.json({ message: 'Failed to process SOH file.', error: errorMessage }, { status: 500 });
  }
}
