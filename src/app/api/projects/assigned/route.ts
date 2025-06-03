
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import type { User, STOProject } from '@/lib/types';
import { parse } from 'cookie';

async function getAdminUserFromSession(req: NextRequest): Promise<User | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  const sessionCookie = cookies['stockflow-session'];
  if (!sessionCookie) return null;

  try {
    const userData = JSON.parse(sessionCookie) as User; 
    if (userData && userData.id && (userData.role === 'admin_input' || userData.role === 'admin_doc_control' || userData.role === 'admin_verification')) {
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing session cookie for admin (assigned projects API):", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUserFromSession(req);

  if (!adminUser || !adminUser.id) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required or session invalid.' }, { status: 401 });
  }

  try {
    const projectsQuery = query(
      collection(db, 'sto_projects'),
      where('assignedAdminUserIds', 'array-contains', adminUser.id)
      // We might also want to filter by project status here, e.g., only 'Active', 'Counting', 'Verification'
      // where('status', 'in', ['Active', 'Counting', 'Verification']) 
    );

    const querySnapshot = await getDocs(projectsQuery);
    
    const assignedProjects = querySnapshot.docs.map(doc => {
      const data = doc.data() as STOProject;
      // Return a simplified project object suitable for selection
      return { 
        id: doc.id, 
        name: data.name,
        status: data.status,
        clientName: data.clientName,
        departmentName: data.departmentName,
      };
    });

    return NextResponse.json(assignedProjects, { status: 200 });

  } catch (error) {
    console.error('Error fetching assigned projects for admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch assigned projects.', error: errorMessage }, { status: 500 });
  }
}
