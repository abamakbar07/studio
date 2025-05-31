
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/approval/invalid?message=Token_missing', req.url));
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('approvalToken', '==', token),
      where('role', '==', 'superuser')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.redirect(new URL('/auth/approval/invalid?message=Token_not_found_or_expired', req.url));
    }

    let success = false;
    const batch = writeBatch(db);

    for (const userDoc of querySnapshot.docs) {
      const user = userDoc.data() as User;
      const now = new Date();
      const expires = user.approvalTokenExpires ? new Date(user.approvalTokenExpires) : null;

      if (expires && expires < now) {
        // Token expired, clear it
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          approvalToken: null,
          approvalTokenExpires: null,
          updatedAt: now.toISOString(),
        });
        // continue to redirect to invalid, don't process further for this user
      } else if (!user.approved) {
        // Token is valid and user is not yet approved
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          approved: true,
          isActive: true, // Superusers become active immediately on approval
          approvalToken: null, 
          approvalTokenExpires: null,
          updatedAt: now.toISOString(),
        });
        success = true; // At least one user was successfully approved
      } else {
        // User already approved, clear token if somehow still present
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          approvalToken: null,
          approvalTokenExpires: null,
          updatedAt: now.toISOString(),
        });
      }
    }

    await batch.commit();

    if (success) {
      return NextResponse.redirect(new URL('/auth/approval/success', req.url));
    } else {
      // This means token was found but was expired, or user already approved
      return NextResponse.redirect(new URL('/auth/approval/invalid?message=Token_expired_or_user_already_processed', req.url));
    }

  } catch (error) {
    console.error('Superuser approval error:', error);
    return NextResponse.redirect(new URL('/auth/approval/error', req.url));
  }
}
