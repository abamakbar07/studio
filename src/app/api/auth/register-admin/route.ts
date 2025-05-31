
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { generateToken, getTokenExpiry } from '@/lib/utils';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Cost factor for bcrypt

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, superuserEmail } = await req.json() as Omit<User, 'id' | 'createdAt' | 'approved' | 'isActive' | 'emailVerified'> & { password?: string };

    if (!name || !email || !password || !role || !superuserEmail) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    if (role === 'superuser') {
        return NextResponse.json({ message: 'Cannot register as superuser through this route.' }, { status: 400 });
    }

    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    const superuserQuery = query(
      collection(db, 'users'),
      where('email', '==', superuserEmail),
      where('role', '==', 'superuser'),
      where('approved', '==', true)
    );
    const superuserSnapshot = await getDocs(superuserQuery);
    if (superuserSnapshot.empty) {
      return NextResponse.json({ message: 'Invalid or unapproved superuser email provided for association.' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const verificationToken = generateToken();
    const now = new Date().toISOString();

    const newAdminRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      password: hashedPassword,
      role,
      superuserEmail,
      approved: false, 
      emailVerified: false,
      isActive: false, 
      verificationToken,
      verificationTokenExpires: getTokenExpiry(24), 
      createdAt: now,
      updatedAt: now,
    } as Omit<User, 'id'> );

    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      NEXT_PUBLIC_APP_URL 
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !NEXT_PUBLIC_APP_URL) {
      console.error('Missing email or app URL configuration for admin verification email.');
      return NextResponse.json({ 
        message: `Admin user ${email} registered pending email verification and superuser approval. Failed to send verification email due to server misconfiguration.`,
        userId: newAdminRef.id 
      }, { status: 201 });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465, 
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const verificationLink = `${NEXT_PUBLIC_APP_URL}/api/auth/verify-email/${verificationToken}`;
    const mailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email for StockFlow Admin Account',
      html: `
        <p>Dear ${name},</p>
        <p>An admin account has been created for you on StockFlow.</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>After verifying your email, a superuser will need to approve and activate your account before you can log in.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: 'Admin user registered successfully. Please check your email to verify your address. A superuser needs to approve and activate your account.', 
      userId: newAdminRef.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Admin registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to register admin user.', error: errorMessage }, { status: 500 });
  }
}
