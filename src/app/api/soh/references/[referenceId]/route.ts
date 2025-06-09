
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { User, SOHDataReference, STOProject } from '@/lib/types';
import { parse } from 'cookie';

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
    console.error("Error parsing session cookie for superuser:", error);
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { referenceId: string } }
) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  const { referenceId } = params;
  if (!referenceId) {
    return NextResponse.json({ message: 'SOH Data Reference ID is required.' }, { status: 400 });
  }

  try {
    const { isLocked } = await req.json();
    if (typeof isLocked !== 'boolean') {
      return NextResponse.json({ message: 'Invalid request body: isLocked (boolean) is required.' }, { status: 400 });
    }

    const sohRefDocRef = doc(db, 'soh_data_references', referenceId);
    const sohRefDocSnap = await getDoc(sohRefDocRef);

    if (!sohRefDocSnap.exists()) {
      return NextResponse.json({ message: 'SOH Data Reference not found.' }, { status: 404 });
    }
    const sohRefData = sohRefDocSnap.data() as SOHDataReference;

    // Authorization: Ensure superuser owns the project this SOH reference belongs to
    const projectDocRef = doc(db, 'sto_projects', sohRefData.stoProjectId);
    const projectDocSnap = await getDoc(projectDocRef);
    if (!projectDocSnap.exists() || (projectDocSnap.data() as STOProject).createdBy !== superuser.email) {
        return NextResponse.json({ message: 'Forbidden: You do not own the project associated with this SOH reference.' }, { status: 403 });
    }

    await updateDoc(sohRefDocRef, {
      isLocked: isLocked,
      updatedAt: Timestamp.now().toDate().toISOString(), // Assuming you have an updatedAt field
    });

    return NextResponse.json({ message: `SOH Data Reference ${isLocked ? 'locked' : 'unlocked'} successfully.` }, { status: 200 });

  } catch (error) {
    console.error('Error updating SOH Data Reference lock status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to update SOH Data Reference lock status.', error: errorMessage }, { status: 500 });
  }
}
