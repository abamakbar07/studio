
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import type { User, SOHDataReference, STOProject } from '@/lib/types';
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

  // Authorization Check
  try {
    const projectDocRef = doc(db, 'sto_projects', stoProjectId);
    const projectDocSnap = await getDoc(projectDocRef);

    if (!projectDocSnap.exists()) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }
    const projectData = projectDocSnap.data() as STOProject;

    if (currentUser.role === 'superuser') {
      // Superuser must own the project to see its SOH references
      if (projectData.createdBy !== currentUser.email) {
        return NextResponse.json({ message: 'Forbidden: Superusers can only access references for projects they created.' }, { status: 403 });
      }
    } else { // Admin roles
      const selectedProjectCookie = req.cookies.get('stockflow-selected-project');
      if (!selectedProjectCookie || JSON.parse(selectedProjectCookie.value).id !== stoProjectId) {
          return NextResponse.json({ message: 'Forbidden: Admins can only fetch references for their currently selected project (cookie mismatch).' }, { status: 403 });
      }
      // Admin must be assigned to the project
      if (!projectData.assignedAdminUserIds || !projectData.assignedAdminUserIds.includes(currentUser.id)) {
        return NextResponse.json({ message: 'Forbidden: You are not assigned to this project.' }, { status: 403 });
      }
    }
  } catch (authError) {
    console.error('Error during authorization check for SOH references:', authError);
    const errorMessage = authError instanceof Error ? authError.message : 'An unknown authorization error occurred';
    return NextResponse.json({ message: 'Failed to authorize SOH reference access.', error: errorMessage }, { status: 500 });
  }


  try {
    const referencesQuery = query(
      collection(db, 'soh_data_references'),
      where('stoProjectId', '==', stoProjectId),
      orderBy('uploadedAt', 'desc') // Changed from processedAt for more consistent ordering from upload time
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

