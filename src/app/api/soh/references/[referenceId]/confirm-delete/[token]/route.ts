
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, writeBatch, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { SOHDataReference } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { referenceId: string; token: string } }
) {
  const { referenceId, token } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


  if (!referenceId || !token) {
    return NextResponse.redirect(new URL('/soh/delete-status/invalid?message=Missing_reference_or_token', appUrl));
  }

  try {
    const sohRefDocRef = doc(db, 'soh_data_references', referenceId);
    const sohRefDocSnap = await getDoc(sohRefDocRef);

    if (!sohRefDocSnap.exists()) {
      return NextResponse.redirect(new URL('/soh/delete-status/invalid?message=Reference_not_found', appUrl));
    }

    const sohRefData = sohRefDocSnap.data() as SOHDataReference;

    if (sohRefData.deleteApprovalToken !== token) {
      return NextResponse.redirect(new URL('/soh/delete-status/invalid?message=Token_mismatch', appUrl));
    }

    if (sohRefData.deleteApprovalTokenExpires && new Date(sohRefData.deleteApprovalTokenExpires) < new Date()) {
      // Clear the expired token and revert status if it was Pending Deletion
      await updateDoc(sohRefDocRef, {
        deleteApprovalToken: null,
        deleteApprovalTokenExpires: null,
        status: sohRefData.status === 'Pending Deletion' ? 'Completed' : sohRefData.status, // Revert to Completed or keep current if changed
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      return NextResponse.redirect(new URL('/soh/delete-status/invalid?message=Token_expired', appUrl));
    }

    // Token is valid, proceed with deletion
    const batch = writeBatch(db);

    // 1. Delete associated StockItems
    const stockItemsQuery = query(
      collection(db, 'stock_items'),
      where('sohDataReferenceId', '==', referenceId)
    );
    const stockItemsSnapshot = await getDocs(stockItemsQuery);
    
    let deletedItemCount = 0;
    if (!stockItemsSnapshot.empty) {
      stockItemsSnapshot.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
        deletedItemCount++;
      });
    }
    
    // 2. Delete the SOHDataReference document
    batch.delete(sohRefDocRef);

    await batch.commit();

    return NextResponse.redirect(new URL(`/soh/delete-status/success?filename=${encodeURIComponent(sohRefData.originalFilename || sohRefData.filename)}&items_deleted=${deletedItemCount}`, appUrl));

  } catch (error) {
    console.error('Error confirming SOH Data Reference deletion:', error);
    return NextResponse.redirect(new URL('/soh/delete-status/error', appUrl));
  }
}
