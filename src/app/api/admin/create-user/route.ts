
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie'; // For server-side, we need to parse cookies from headers
import { parse } from 'cookie';


const SALT_ROUNDS = 10;

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
        return NextResponse.json({ message: 'Unauthorized: No session cookie provided.' }, { status: 401 });
    }
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies['stockflow-session'];

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized: Session not found.' }, { status: 401 });
    }

    let superuserData: User | null = null;
    try {
      superuserData = JSON.parse(sessionCookie);
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized: Invalid session data.' }, { status: 401 });
    }

    if (!superuserData || superuserData.role !== 'superuser') {
      return NextResponse.json({ message: 'Forbidden: Only superusers can create admin users.' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json() as Omit<User, 'id' | 'createdAt' | 'approved' | 'isActive' | 'emailVerified' | 'superuserEmail'> & { password?: string };

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields (name, email, password, role).' }, { status: 400 });
    }

    if (role === 'superuser') {
        return NextResponse.json({ message: 'Cannot create a superuser through this route.' }, { status: 400 });
    }
    if (!["admin_input", "admin_doc_control", "admin_verification"].includes(role)) {
        return NextResponse.json({ message: 'Invalid admin role specified.' }, { status: 400 });
    }


    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      return NextResponse.json({ message: 'Admin user with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const newAdminUser: Omit<User, 'id'> = {
      name,
      email,
      password: hashedPassword,
      role,
      superuserEmail: superuserData.email, // Associate with the creating superuser
      emailVerified: true, // Superuser is vouching for this user
      approved: true,      // Approved by the superuser creating them
      isActive: true,      // Active immediately
      verificationToken: null,
      verificationTokenExpires: null,
      approvalToken: null,
      approvalTokenExpires: null,
      createdAt: now,
      updatedAt: now,
    };

    const newAdminRef = await addDoc(collection(db, 'users'), newAdminUser);

    return NextResponse.json({
      message: `Admin user ${email} created successfully and is active.`,
      userId: newAdminRef.id
    }, { status: 201 });

  } catch (error) {
    console.error('Create admin user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create admin user.', error: errorMessage }, { status: 500 });
  }
}
