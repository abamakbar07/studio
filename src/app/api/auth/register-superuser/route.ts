
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import type { User } from '@/lib/types';
import { generateToken, getTokenExpiry } from '@/lib/utils';

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

    const verificationToken = generateToken();
    const approvalToken = generateToken();
    const now = new Date().toISOString();

    const newUserRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      password, // WARNING: Storing plain text password. Hash in real app.
      role: 'superuser',
      approved: false,
      emailVerified: false,
      isActive: false, // Superusers become active upon approval
      verificationToken,
      verificationTokenExpires: getTokenExpiry(24), // 24 hours
      approvalToken,
      approvalTokenExpires: getTokenExpiry(7 * 24), // 7 days for approval
      createdAt: now,
      updatedAt: now,
    } as Omit<User, 'id'>);

    // Send verification email
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      ADMINISTRATOR_EMAIL, // This is muhamad.afriansyah@dsv.com or dev@akbarafriansyah.my.id
      NEXT_PUBLIC_APP_URL // Base URL of the app
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ADMINISTRATOR_EMAIL || !NEXT_PUBLIC_APP_URL) {
      console.error('Missing email or app URL configuration in environment variables.');
      // User is created, but email failed.
      return NextResponse.json({ 
        message: 'Superuser registration submitted. However, failed to send critical emails due to server misconfiguration. Please contact support.',
        userId: newUserRef.id 
      }, { status: 201 }); // 201 because user created, but with a warning
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

    // 1. Email for User to verify their email address
    const verificationLink = `${NEXT_PUBLIC_APP_URL}/api/auth/verify-email/${verificationToken}`; // MODIFIED: Added /api
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

    // 2. Email for Administrator to approve the superuser registration
    const approvalLink = `${NEXT_PUBLIC_APP_URL}/api/auth/approve-superuser/${approvalToken}`; // API route for direct approval
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
