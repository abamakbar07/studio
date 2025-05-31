
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json(); // Password not stored directly, but might be used if integrating Firebase Auth later

    if (!name || !email) {
      return NextResponse.json({ message: 'Missing name or email.' }, { status: 400 });
    }

    // 1. Create user document in Firestore
    const newUserRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      role: 'superuser',
      approved: false,
      createdAt: new Date().toISOString(), // Client-side timestamp for simplicity, or use serverTimestamp()
      updatedAt: new Date().toISOString(),
    });

    // 2. Send approval email
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      ADMINISTRATOR_EMAIL,
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ADMINISTRATOR_EMAIL) {
      console.error('Missing email configuration in environment variables for superuser approval.');
      // User is created, but email failed. This might need manual follow-up.
      return NextResponse.json({ 
        message: 'User registered pending approval, but failed to send notification email due to server misconfiguration.',
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

    const mailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: ADMINISTRATOR_EMAIL,
      subject: 'New Superuser Registration for StockFlow - Approval Required',
      html: `
        <p>Dear Administrator,</p>
        <p>A new user has registered for a superuser account on StockFlow and requires your approval.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>User ID:</strong> ${newUserRef.id}</p>
        <p>Please log in to the StockFlow admin panel to review and approve this registration.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ message: 'Superuser registration submitted successfully. Awaiting approval.', userId: newUserRef.id }, { status: 201 });

  } catch (error) {
    console.error('Superuser registration or email sending error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to register superuser or send approval email.', error: errorMessage }, { status: 500 });
  }
}
