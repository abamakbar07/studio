
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  console.log("[API /auth/verify-email] Received token:", token);

  if (!token) {
    console.log("[API /auth/verify-email] Token missing, redirecting to invalid.");
    return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_missing', req.url));
  }

  try {
    console.log("[API /auth/verify-email] Attempting to query Firestore for token:", token);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('verificationToken', '==', token));
    const querySnapshot = await getDocs(q);
    console.log("[API /auth/verify-email] Firestore query completed. Snapshot empty:", querySnapshot.empty);

    if (querySnapshot.empty) {
      console.log("[API /auth/verify-email] Token not found in Firestore, redirecting to invalid.");
      return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_not_found', req.url));
    }

    let success = false;
    const batch = writeBatch(db);
    console.log("[API /auth/verify-email] Processing user documents found:", querySnapshot.docs.length);

    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data() as User; // Renamed to avoid conflict with outer 'User' type
      console.log("[API /auth/verify-email] Processing user:", userData.email);
      const now = new Date();
      const expires = userData.verificationTokenExpires ? new Date(userData.verificationTokenExpires) : null;

      if (expires && expires < now) {
        console.log("[API /auth/verify-email] Token expired for user:", userData.email);
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: now.toISOString(),
        });
      } else if (!userData.emailVerified) {
        console.log("[API /auth/verify-email] Token valid, verifying email for user:", userData.email);
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          emailVerified: true,
          verificationToken: null, 
          verificationTokenExpires: null,
          updatedAt: now.toISOString(),
        });
        success = true;
      } else {
        // Email already verified
        console.log("[API /auth/verify-email] Email already verified for user:", userData.email);
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
            verificationToken: null, 
            verificationTokenExpires: null,
            updatedAt: now.toISOString(),
        });
        // If the token is still valid (not expired) for an already verified user, treat as success.
        if (expires && expires >= now) {
            success = true; 
        }
      }
    }
    
    console.log("[API /auth/verify-email] Attempting to commit batch to Firestore. Success flag:", success);
    await batch.commit();
    console.log("[API /auth/verify-email] Firestore batch commit completed.");

    if (success) {
      console.log("[API /auth/verify-email] Verification successful, redirecting to success page.");
      return NextResponse.redirect(new URL('/auth/verify-email/success', req.url));
    } else {
      // This case implies the token was found but was expired.
      console.log("[API /auth/verify-email] Verification not successful (e.g., token expired), redirecting to invalid page.");
      return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_expired_or_already_verified', req.url));
    }

  } catch (error) {
    console.error('[API /auth/verify-email] Error during email verification:', error);
    // Ensure a redirect happens even if an error occurs before other redirects.
    return NextResponse.redirect(new URL('/auth/verify-email/error', req.url));
  }
}
