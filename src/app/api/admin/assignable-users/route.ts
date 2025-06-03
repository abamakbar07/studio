
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { parse } from 'cookie';

// Helper function to get superuser from session (can be moved to a shared util if used elsewhere)
async function getSuperuserFromSession(req: NextRequest): Promise<User | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  const sessionCookie = cookies['stockflow-session'];
  if (!sessionCookie) return null;

  try {
    const superuserData = JSON.parse(sessionCookie) as User;
    if (superuserData && superuserData.role === 'superuser' && superuserData.email) {
      return superuserData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing session cookie in API (assignable-users):", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  try {
    const adminRoles = ["admin_input", "admin_doc_control", "admin_verification"];
    const usersQuery = query(
      collection(db, 'users'),
      where('superuserEmail', '==', superuser.email),
      where('role', 'in', adminRoles),
      where('approved', '==', true),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(usersQuery);
    const assignableUsers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
    });

    return NextResponse.json(assignableUsers, { status: 200 });

  } catch (error) {
    console.error('Error fetching assignable admin users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch assignable admin users.', error: errorMessage }, { status: 500 });
  }
}
