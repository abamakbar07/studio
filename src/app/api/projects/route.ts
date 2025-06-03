
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import type { User, STOProject, STOProjectStatus } from '@/lib/types';
import { parse } from 'cookie';
import { STO_PROJECT_STATUS_LIST } from '@/lib/constants';

// Helper function to get superuser from session
async function getSuperuserFromSession(req: NextRequest): Promise<User | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  const sessionCookie = cookies['stockflow-session'];
  if (!sessionCookie) return null;

  try {
    const superuserData = JSON.parse(sessionCookie) as User; // Assuming the cookie stores User object
    if (superuserData && superuserData.role === 'superuser') {
      // Optionally, you might want to re-fetch the user from DB to ensure session is still valid
      // For now, we'll trust the cookie data if it looks like a superuser.
      return superuserData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing session cookie in API:", error);
    return null;
  }
}

// POST: Create a new STO Project
export async function POST(req: NextRequest) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser || !superuser.email) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, clientName, departmentName, settingsNotes } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Project name is required and must be a non-empty string.' }, { status: 400 });
    }

    const now = Timestamp.now();

    const newProjectData: Omit<STOProject, 'id'> = {
      name: name.trim(),
      description: description || '',
      status: 'Planning', // Default status
      clientName: clientName || '',
      departmentName: departmentName || '',
      settingsNotes: settingsNotes || '',
      createdBy: superuser.email,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };

    const projectRef = await addDoc(collection(db, 'sto_projects'), newProjectData);

    return NextResponse.json({ message: 'STO Project created successfully.', projectId: projectRef.id, project: {id: projectRef.id, ...newProjectData} }, { status: 201 });

  } catch (error) {
    console.error('Error creating STO project:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create STO project.', error: errorMessage }, { status: 500 });
  }
}

// GET: Fetch STO Projects for the logged-in superuser
export async function GET(req: NextRequest) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser || !superuser.email) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  try {
    const projectsQuery = query(
      collection(db, 'sto_projects'),
      where('createdBy', '==', superuser.email)
      // You might want to add orderBy('createdAt', 'desc') or similar
    );
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as STOProject));

    return NextResponse.json(projects, { status: 200 });

  } catch (error) {
    console.error('Error fetching STO projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch STO projects.', error: errorMessage }, { status: 500 });
  }
}

// PATCH: Update an STO Project (e.g., status, details)
export async function PATCH(req: NextRequest) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser || !superuser.email) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, ...updateData } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ message: 'Project ID is required.' }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No update data provided.' }, { status: 400 });
    }
    
    if (updateData.status && !STO_PROJECT_STATUS_LIST.includes(updateData.status as STOProjectStatus)) {
        return NextResponse.json({ message: 'Invalid project status provided.' }, { status: 400 });
    }


    const projectDocRef = doc(db, 'sto_projects', projectId);
    // Validate that the project belongs to the superuser before updating
    const projectDocSnapshot = await getDoc(projectDocRef);

    if (!projectDocSnapshot.exists()) {
        return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const projectData = projectDocSnapshot.data() as STOProject;
    if (projectData.createdBy !== superuser.email) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to update this project.' }, { status: 403 });
    }
    
    const currentProjectData = projectDocSnapshot.data() as STOProject;

    // Basic status transition validation (can be expanded)
    // For example, prevent going from Archived to Planning directly without specific logic
    if (updateData.status && currentProjectData.status === "Archived" && updateData.status === "Planning") {
        // Potentially allow unarchiving, but for now let's assume this might be restricted
        // return NextResponse.json({ message: 'Cannot directly move project from Archived to Planning.' }, { status: 400 });
    }


    const finalUpdateData = { ...updateData, updatedAt: Timestamp.now().toDate().toISOString() };
    await updateDoc(projectDocRef, finalUpdateData);

    return NextResponse.json({ message: 'STO Project updated successfully.', projectId }, { status: 200 });

  } catch (error) {
    console.error('Error updating STO project:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to update STO project.', error: errorMessage }, { status: 500 });
  }
}
