
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import nodemailer from 'nodemailer';

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
    let verifiedAdminUser: User | null = null;
    let associatedSuperuserEmail: string | null = null;

    const batch = writeBatch(db);

    for (const userDoc of querySnapshot.docs) {
      const userData = { id: userDoc.id, ...userDoc.data() } as User;
      const now = new Date();
      const expires = userData.verificationTokenExpires ? new Date(userData.verificationTokenExpires) : null;

      if (expires && expires < now) {
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: now.toISOString(),
        });
      } else if (!userData.emailVerified) {
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: now.toISOString(),
        });
        success = true;
        if (userData.role !== 'superuser' && userData.superuserEmail) {
          verifiedAdminUser = userData;
          associatedSuperuserEmail = userData.superuserEmail;
        }
      } else {
        const userDocRef = doc(db, 'users', userDoc.id);
        batch.update(userDocRef, {
            verificationToken: null,
            verificationTokenExpires: null,
            updatedAt: now.toISOString(),
        });
        if (expires && expires >= now) {
            success = true;
        }
      }
    }
    
    await batch.commit();

    if (success && verifiedAdminUser && associatedSuperuserEmail) {
      const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, NEXT_PUBLIC_APP_URL } = process.env;

      if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !NEXT_PUBLIC_APP_URL) {
        console.error('[API /api/auth/verify-email] Missing email configuration for sending superuser notification.');
      } else {
        try {
          let superuserName = "Superuser";
          const superuserQuery = query(collection(db, 'users'), where('email', '==', associatedSuperuserEmail), where('role', '==', 'superuser'));
          const superuserSnapshot = await getDocs(superuserQuery);
          if (!superuserSnapshot.empty) {
            const superuserData = superuserSnapshot.docs[0].data() as User;
            superuserName = superuserData.name || superuserName;
          }

          const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: Number(EMAIL_PORT),
            secure: Number(EMAIL_PORT) === 465,
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
          });

          const userManagementLink = `${NEXT_PUBLIC_APP_URL}/dashboard/admin/user-management`;
          const mailOptions = {
            from: `"StockFlow System" <${EMAIL_USER}>`,
            to: associatedSuperuserEmail,
            subject: 'StockFlow: Admin User Awaiting Approval',
            html: `
              <p>Dear ${superuserName},</p>
              <p>The admin user, <strong>${verifiedAdminUser.name}</strong> (Email: ${verifiedAdminUser.email}), has successfully verified their email address.</p>
              <p>They are now awaiting your approval and account activation.</p>
              <p>Please visit the <a href="${userManagementLink}">User Management page</a> in your StockFlow dashboard to review and process this request.</p>
              <p>Thank you,</p>
              <p>The StockFlow System</p>
            `,
          };
          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error(`[API /api/auth/verify-email] Failed to send notification email to superuser ${associatedSuperuserEmail}:`, emailError);
        }
      }
    }

    if (success) {
      return NextResponse.redirect(new URL('/auth/verify-email/success', req.url));
    } else {
      return NextResponse.redirect(new URL('/auth/verify-email/invalid?message=Token_expired_or_already_verified', req.url));
    }

  } catch (error) {
    console.error('[API /api/auth/verify-email] Error during email verification or notification process:', error);
    return NextResponse.redirect(new URL('/auth/verify-email/error', req.url));
  }
}
