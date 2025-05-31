
import { NextResponse, type NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email: userEmail } = await req.json();

    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      ADMINISTRATOR_EMAIL,
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ADMINISTRATOR_EMAIL) {
      console.error('Missing email configuration in environment variables');
      return NextResponse.json({ message: 'Email server not configured.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"StockFlow System" <${EMAIL_USER}>`,
      to: ADMINISTRATOR_EMAIL,
      subject: 'New Superuser Registration for StockFlow - Approval Required',
      html: `
        <p>Dear Administrator,</p>
        <p>A new user has registered for a superuser account on StockFlow and requires your approval.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p>Please log in to the StockFlow admin panel to review and approve this registration.</p>
        <p>Thank you,</p>
        <p>The StockFlow System</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Approval email sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to send approval email.', error: errorMessage }, { status: 500 });
  }
}
