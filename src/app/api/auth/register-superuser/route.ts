
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';
import { generateToken, getTokenExpiry } from '@/lib/utils';

const SALT_ROUNDS = 10; // Cost factor for bcrypt

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing name, email, or password.' }, { status: 400 });
    }

    // Check if user already exists
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const verificationToken = generateToken();
    const approvalToken = generateToken();
    const now = new Date().toISOString();

    const newUserRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      password: hashedPassword,
      role: 'superuser',
      approved: false,
      emailVerified: false,
      isActive: false,
      verificationToken,
      verificationTokenExpires: getTokenExpiry(24),
      approvalToken,
      approvalTokenExpires: getTokenExpiry(7 * 24),
      createdAt: now,
      updatedAt: now,
    } as Omit<User, 'id'>);

    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      ADMINISTRATOR_EMAIL,
      NEXT_PUBLIC_APP_URL
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ADMINISTRATOR_EMAIL || !NEXT_PUBLIC_APP_URL) {
      console.error('Missing email or app URL configuration in environment variables.');
      return NextResponse.json({ 
        message: 'Superuser registration submitted. However, failed to send critical emails due to server misconfiguration. Please contact support.',
        userId: newUserRef.id 
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
    const verificationMailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address for StockFlow',
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for registering as a superuser on StockFlow.</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>After verifying your email, your account will await administrator approval.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };
    await transporter.sendMail(verificationMailOptions);

    const approvalLink = `${NEXT_PUBLIC_APP_URL}/api/auth/approve-superuser/${approvalToken}`;
    const adminMailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: ADMINISTRATOR_EMAIL,
      subject: 'New Superuser Registration for StockFlow - Approval Required',
      html: `
        <p>Dear Administrator,</p>
        <p>A new user has registered for a superuser account on StockFlow and requires your approval.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>User ID:</strong> ${newUserRef.id}</p>
        <p>To approve this user, please click the following link (no login required):</p>
        <p><a href="${approvalLink}">${approvalLink}</a></p>
        <p>This approval link will expire in 7 days.</p>
        <p>If you do not approve this registration, no further action is needed.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };
    await transporter.sendMail(adminMailOptions);
    
    return NextResponse.json({ 
      message: 'Superuser registration submitted. Please check your email to verify your address. Administrator approval will follow.', 
      userId: newUserRef.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Superuser registration or email sending error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to register superuser or send emails.', error: errorMessage }, { status: 500 });
  }
}
