
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { User, SOHDataReference, STOProject } from '@/lib/types';
import { parse } from 'cookie';
import { generateToken, getTokenExpiry } from '@/lib/utils';
import nodemailer from 'nodemailer';

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
    console.error("Error parsing session cookie for superuser (delete-request):", error);
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { referenceId: string } }
) {
  const superuser = await getSuperuserFromSession(req);
  if (!superuser || !superuser.email) {
    return NextResponse.json({ message: 'Unauthorized: Superuser access required.' }, { status: 401 });
  }

  const { referenceId } = params;
  if (!referenceId) {
    return NextResponse.json({ message: 'SOH Data Reference ID is required.' }, { status: 400 });
  }

  try {
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

    if (sohRefData.isLocked) {
        return NextResponse.json({ message: 'Forbidden: Cannot request deletion for a locked SOH reference. Please unlock it first.' }, { status: 403 });
    }
    
    // Check if a delete request is already pending and not expired
    if (sohRefData.deleteApprovalToken && sohRefData.deleteApprovalTokenExpires && new Date(sohRefData.deleteApprovalTokenExpires) > new Date()) {
      return NextResponse.json({ message: 'A deletion request for this reference is already pending administrator approval.' }, { status: 409 });
    }

    const deleteToken = generateToken();
    const tokenExpiry = getTokenExpiry(48); // 48 hours for deletion approval

    await updateDoc(sohRefDocRef, {
      status: 'Pending Deletion' as SOHDataReferenceStatus,
      deleteApprovalToken: deleteToken,
      deleteApprovalTokenExpires: tokenExpiry,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });

    // Send email to ADMINISTRATOR_EMAIL
    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      ADMINISTRATOR_EMAIL,
      NEXT_PUBLIC_APP_URL
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ADMINISTRATOR_EMAIL || !NEXT_PUBLIC_APP_URL) {
      console.error('[API soh/delete-request] Missing email or app URL configuration for SOH deletion approval email.');
      // Still return success to user, but log the email issue. Deletion can be confirmed manually if needed.
      return NextResponse.json({ 
        message: `SOH deletion request initiated for ${sohRefData.originalFilename || sohRefData.filename}. Administrator approval email could not be sent due to server misconfiguration.`,
      }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    const confirmationLink = `${NEXT_PUBLIC_APP_URL}/api/soh/references/${referenceId}/confirm-delete/${deleteToken}`;
    
    const mailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: ADMINISTRATOR_EMAIL,
      subject: 'StockFlow: SOH Data Reference Deletion Approval Required',
      html: `
        <p>Dear System Administrator,</p>
        <p>A request has been made by Superuser <strong>${superuser.name} (${superuser.email})</strong> to delete an SOH Data Reference:</p>
        <ul>
          <li><strong>Filename:</strong> ${sohRefData.originalFilename || sohRefData.filename}</li>
          <li><strong>Project:</strong> ${projectDocSnap.data()?.name} (ID: ${sohRefData.stoProjectId})</li>
          <li><strong>Uploaded At:</strong> ${new Date(sohRefData.uploadedAt).toLocaleString()}</li>
          <li><strong>Item Count:</strong> ${sohRefData.rowCount}</li>
        </ul>
        <p><strong>This action will permanently delete the SOH reference and all ${sohRefData.rowCount} associated stock items from the database. This cannot be undone.</strong></p>
        <p>To approve this deletion, please click the following link (no login required):</p>
        <p><a href="${confirmationLink}">${confirmationLink}</a></p>
        <p>This approval link will expire in 48 hours (around ${new Date(tokenExpiry).toLocaleString()}).</p>
        <p>If you do not approve this request, no action is needed. The reference will remain in 'Pending Deletion' status until the token expires, after which it can be re-evaluated.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
        message: `SOH deletion request initiated for ${sohRefData.originalFilename || sohRefData.filename}. An approval email has been sent to the System Administrator.` 
    }, { status: 200 });

  } catch (error) {
    console.error('Error initiating SOH Data Reference deletion:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to initiate SOH Data Reference deletion.', error: errorMessage }, { status: 500 });
  }
}
