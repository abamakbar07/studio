
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    if (!user.password) {
        // This should ideally not happen if registration always hashes a password
        console.error(`User ${email} has no password stored.`);
        return NextResponse.json({ message: 'Authentication error. Please contact support.' }, { status: 500 });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ message: 'Email not verified. Please check your inbox for a verification link.' }, { status: 403 });
    }

    if (!user.approved) {
      return NextResponse.json({ message: 'Account not approved. Please wait for administrator approval.' }, { status: 403 });
    }
    
    if (user.role !== 'superuser' && !user.isActive) {
        return NextResponse.json({ message: 'Account not activated. A superuser must activate your account.' }, { status: 403 });
    }
    
    if (user.role === 'superuser' && !user.isActive && user.approved) {
         return NextResponse.json({ message: 'Superuser account approved but not active. Please contact support.' }, { status: 403 });
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    cookies().set('stockflow-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });
    
    const { password: _, ...userResponse } = user;

    return NextResponse.json({ message: 'Login successful', user: userResponse }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Login failed.', error: errorMessage }, { status: 500 });
  }
}
