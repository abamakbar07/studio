
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, writeBatch, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
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

interface ExpectedRow {
  SKU: string;
  Description: string;
  'SOH Quantity': number; // Matches typical Excel header
  Location?: string;
}


export async function POST(req: NextRequest) {
  const currentUser = await getUserFromSession(req);
  if (!currentUser) {
    return NextResponse.json({ message: 'Unauthorized: User session not found.' }, { status: 401 });
  }

  // Authorization: Check if user can upload (Superuser or specific Admin roles)
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


    // 1. Create SOHDataReference document with "Processing" status
    const initialSohRefData: Omit<SOHDataReference, 'id'> = {
      filename: file.name,
      originalFilename: file.name,
      uploadedBy: currentUser.email, // or currentUser.id
      uploadedAt: Timestamp.now().toDate().toISOString(),
      rowCount: 0,
      status: 'Processing' as SOHDataReferenceStatus,
      stoProjectId: stoProjectId,
      contentType: file.type,
      size: file.size,
    };
    const sohReferenceRef = await addDoc(collection(db, 'soh_data_references'), initialSohRefData);
    sohReferenceDocId = sohReferenceRef.id;


    // 2. Parse XLSX
    const bytes = await file.arrayBuffer();
    const workbook = xlsx.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<ExpectedRow>(worksheet, { defval: null }); // Use defval to handle empty cells as null

    if (!jsonData || jsonData.length === 0) {
      await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage: 'File is empty or has no data in the first sheet.' });
      return NextResponse.json({ message: 'File is empty or has no data.' }, { status: 400 });
    }
    
    // Basic Header Validation (adapt column names as needed)
    const headers = xlsx.utils.sheet_to_json<any>(worksheet, { header: 1 })[0] as string[];
    const requiredHeaders = ['SKU', 'Description', 'SOH Quantity']; // Case-sensitive match to ExpectedRow
    for (const header of requiredHeaders) {
        if (!headers.includes(header)) {
            await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'ValidationError' as SOHDataReferenceStatus, errorMessage: `Missing required header: ${header}. Expected headers: ${requiredHeaders.join(', ')}.` });
            return NextResponse.json({ message: `Missing required header: ${header}. Check column names in your Excel file. Required: ${requiredHeaders.join(', ')}` }, { status: 400 });
        }
    }

    // 3. Transform and Batch Write StockItems
    const batch = writeBatch(db);
    const stockItems: StockItem[] = [];
    let validRowCount = 0;
    const validationErrors: string[] = [];

    await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { status: 'Storing' as SOHDataReferenceStatus });

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Basic data integrity checks for key fields
      if (!row.SKU || typeof row.SKU !== 'string' || row.SKU.trim() === '') {
        validationErrors.push(`Row ${i + 2}: SKU is missing or invalid.`); // +2 for header row and 0-based index
        continue;
      }
      if (row['SOH Quantity'] === null || typeof row['SOH Quantity'] !== 'number' || isNaN(row['SOH Quantity'])) {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.SKU}): 'SOH Quantity' is missing or not a valid number.`);
        continue;
      }
       if (!row.Description || typeof row.Description !== 'string' || row.Description.trim() === '') {
        validationErrors.push(`Row ${i + 2} (SKU: ${row.SKU}): Description is missing or invalid.`);
        continue;
      }


      const stockItemData: Omit<StockItem, 'id'> = {
        sku: String(row.SKU).trim(),
        description: String(row.Description).trim(),
        sohQuantity: Number(row['SOH Quantity']),
        location: row.Location ? String(row.Location).trim() : undefined,
        stoProjectId: stoProjectId,
        sohDataReferenceId: sohReferenceDocId,
      };
      
      const stockItemRef = doc(collection(db, 'stock_items')); // Auto-generate ID
      batch.set(stockItemRef, stockItemData);
      validRowCount++;

      // Firestore batch limit is 500 operations. Commit and start new if needed.
      if (validRowCount % 490 === 0 && validRowCount > 0) { // 490 to be safe
        await batch.commit();
        // batch = writeBatch(db); // Re-initialize batch - this was a bug, batch should be single
      }
    }
    
    // Commit any remaining items in the batch
    if (validRowCount > 0 && (jsonData.length % 490 !== 0 || jsonData.length < 490) ) {
         await batch.commit();
    }


    // 4. Update SOHDataReference status
    if (validationErrors.length > 0 && validRowCount === 0) { // All rows failed validation
        await updateDoc(doc(db, 'soh_data_references', sohReferenceDocId), { 
            status: 'ValidationError' as SOHDataReferenceStatus, 
            errorMessage: `No valid data found. ${validationErrors.length} rows had issues. First few errors: ${validationErrors.slice(0,5).join('; ')}`,
            processedAt: Timestamp.now().toDate().toISOString(),
        });
        return NextResponse.json({ message: `Upload failed: No valid data found. ${validationErrors.join('; ')}` }, { status: 400 });
    }
    
    const finalStatus: SOHDataReferenceStatus = validationErrors.length > 0 ? 'Completed' : 'Completed'; // Could be 'CompletedWithWarnings' if we add that
    const finalErrorMessage = validationErrors.length > 0 ? `Completed with ${validationErrors.length} row errors. First few: ${validationErrors.slice(0,3).join('; ')}` : undefined;

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
