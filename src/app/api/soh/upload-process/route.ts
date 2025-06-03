
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

// Updated to match user's Excel column names
interface ExpectedRow {
  sku: string;
  sku_description: string;
  qty_on_hand: number; 
  loc?: string;
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
      filename: file.name,
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
    const workbook = xlsx.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<ExpectedRow>(worksheet, { defval: null });

    if (!jsonData || jsonData.length === 0) {
      await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage: 'File is empty or has no data in the first sheet.' });
      return NextResponse.json({ message: 'File is empty or has no data.' }, { status: 400 });
    }
    
    const headers = xlsx.utils.sheet_to_json<any>(worksheet, { header: 1 })[0] as string[];
    // Updated required headers to match user's file
    const requiredHeaders = ['sku', 'sku_description', 'qty_on_hand']; 
    for (const header of requiredHeaders) {
        if (!headers.includes(header)) {
            const errorMessage = `Missing required header: ${header}. Check column names in your Excel file. Required: ${requiredHeaders.join(', ')}. Optional: loc.`;
            await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage });
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }
    }

    await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'Storing' as SOHDataReferenceStatus });
    
    let currentBatch = writeBatch(db);
    let operationsInBatch = 0;
    const MAX_OPERATIONS_PER_BATCH = 490; // Firestore batch limit is 500
    let validRowCount = 0;
    const validationErrors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      if (!row.sku || typeof row.sku !== 'string' || String(row.sku).trim() === '') {
        validationErrors.push(`Row ${i + 2}: Column 'sku' is missing or invalid.`);
        continue;
      }
      if (row.qty_on_hand === null || typeof row.qty_on_hand !== 'number' || isNaN(row.qty_on_hand)) {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.sku}): Column 'qty_on_hand' is missing or not a valid number.`);
        continue;
      }
       if (!row.sku_description || typeof row.sku_description !== 'string' || String(row.sku_description).trim() === '') {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.sku}): Column 'sku_description' is missing or invalid.`);
        continue;
      }

      const stockItemData: Omit<StockItem, 'id'> = {
        sku: String(row.sku).trim(),
        description: String(row.sku_description).trim(),
        sohQuantity: Number(row.qty_on_hand),
        location: row.loc ? String(row.loc).trim() : undefined,
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
        });
        return NextResponse.json({ message: `Upload failed: No valid data found. ${validationErrors.join('; ')}` }, { status: 400 });
    }
    
    const finalStatus: SOHDataReferenceStatus = validationErrors.length > 0 && validRowCount > 0 ? 'Completed' : 'Completed'; // Marking 'Completed' even with row errors, error details in errorMessage
    const finalErrorMessage = validationErrors.length > 0 ? `Completed with ${validationErrors.length} row error(s). First few: ${validationErrors.slice(0,3).join('; ')}` : undefined;

    await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), {
      status: finalStatus,
      rowCount: validRowCount,
      processedAt: Timestamp.now().toDate().toISOString(),
      errorMessage: finalErrorMessage,
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
                errorMessage: `System error during processing: ${errorMessage}`,
                processedAt: Timestamp.now().toDate().toISOString(),
            });
        } catch (updateError) {
            console.error('Failed to update SOH reference on error:', updateError);
        }
    }
    return NextResponse.json({ message: 'Failed to process SOH file.', error: errorMessage }, { status: 500 });
  }
}
