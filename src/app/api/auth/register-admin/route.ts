
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, superuserEmail } = await req.json() as Omit<User, 'id' | 'createdAt' | 'approved'> & { password?: string };

    if (!name || !email || !role || !superuserEmail) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    if (role === 'superuser') {
        return NextResponse.json({ message: 'Cannot register as superuser through this route.' }, { status: 400 });
    }

    // Validate superuserEmail exists and is an approved superuser
    const superuserQuery = query(
      collection(db, 'users'),
      where('email', '==', superuserEmail),
      where('role', '==', 'superuser'),
      where('approved', '==', true)
    );
    const superuserSnapshot = await getDocs(superuserQuery);
    if (superuserSnapshot.empty) {
      return NextResponse.json({ message: 'Invalid or unapproved superuser email provided.' }, { status: 400 });
    }

    // Create admin user document in Firestore
    const newAdminRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      role,
      superuserEmail,
      approved: true, // Admins are implicitly approved by superuser association
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Admin user registered successfully.', userId: newAdminRef.id }, { status: 201 });

  } catch (error) {
    console.error('Admin registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to register admin user.', error: errorMessage }, { status: 500 });
  }
}
