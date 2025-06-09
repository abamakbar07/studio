
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { User, SOHDataReference } from '@/lib/types';
import { parse } from 'cookie';

async function getUserFromSession(req: NextRequest): Promise<User | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  const sessionCookie = cookies['stockflow-session'];
  if (!sessionCookie) return null;

  try {
    const userData = JSON.parse(sessionCookie) as User;
    if (userData && userData.id && userData.email) {
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing session cookie in API (soh/references):", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const currentUser = await getUserFromSession(req);
  if (!currentUser) {
    return NextResponse.json({ message: 'Unauthorized: User session not found.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stoProjectId = searchParams.get('stoProjectId');

  if (!stoProjectId) {
    return NextResponse.json({ message: 'STO Project ID is required as a query parameter.' }, { status: 400 });
  }

  // Authorization: Ensure user has access to this project's SOH data.
  // For simplicity here, we'll assume if an admin selected it, or a superuser is querying, it's allowed.
  // A more robust check would verify project ownership or assignment.
  // e.g., check if currentUser.role === 'superuser' and project createdBy them, 
  // or if admin, check if stoProjectId matches their selectedProject from session/cookie and they are assigned.

  if (currentUser.role !== 'superuser') {
    const selectedProjectCookie = req.cookies.get('stockflow-selected-project');
    if (!selectedProjectCookie || JSON.parse(selectedProjectCookie.value).id !== stoProjectId) {
        return NextResponse.json({ message: 'Forbidden: Admins can only fetch references for their currently selected project.' }, { status: 403 });
    }
  }


  try {
    const referencesQuery = query(
      collection(db, 'soh_data_references'),
      where('stoProjectId', '==', stoProjectId),
      orderBy('processedAt', 'desc') // Order by processedAt or uploadedAt
    );

    const querySnapshot = await getDocs(referencesQuery);
    const references = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOHDataReference));

    return NextResponse.json(references, { status: 200 });

  } catch (error) {
    console.error('Error fetching SOH references:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch SOH references.', error: errorMessage }, { status: 500 });
  }
}
