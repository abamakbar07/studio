
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
    return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_missing', req.url));
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('verificationToken', '==', token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_not_found', req.url));
    }

    let success = false;
    const batch = writeBatch(db);

    for (const userDoc of querySnapshot.docs) {
      const user = userDoc.data() as User;
      const now = new Date();
      const expires = user.verificationTokenExpires ? new Date(user.verificationTokenExpires) : null;

      if (expires && expires < now) {
        // Token expired, can optionally clear it or leave as is for record
         const userDocRef = doc(db, 'users', userDoc.id);
          batch.update(userDocRef, {
            verificationToken: null, // Optionally clear expired token
            verificationTokenExpires: null,
            updatedAt: now.toISOString(),
          });
        // continue, don't mark as success
      } else if (!user.emailVerified) {
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          emailVerified: true,
          verificationToken: null, // Clear token after use
          verificationTokenExpires: null,
          updatedAt: now.toISOString(),
        });
        success = true;
      } else {
         // Already verified, clear token if somehow still present
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
            verificationToken: null, 
            verificationTokenExpires: null,
            updatedAt: now.toISOString(),
        });
      }
    }
    
    await batch.commit();

    if (success) {
      return NextResponse.redirect(new URL('/auth/verify-email/success', req.url));
    } else {
      // Token found but was expired or user already verified
      return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_expired_or_already_verified', req.url));
    }

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/verify-email/error', req.url));
  }
}
