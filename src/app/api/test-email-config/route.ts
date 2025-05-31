
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS, // We check for its presence but won't return its value
    ADMINISTRATOR_EMAIL,
  } = process.env;

  const missingVariables: string[] = [];
  if (!EMAIL_HOST) missingVariables.push('EMAIL_HOST');
  if (!EMAIL_PORT) missingVariables.push('EMAIL_PORT');
  if (!EMAIL_USER) missingVariables.push('EMAIL_USER');
  if (!EMAIL_PASS) missingVariables.push('EMAIL_PASS');
  if (!ADMINISTRATOR_EMAIL) missingVariables.push('ADMINISTRATOR_EMAIL');

  if (missingVariables.length > 0) {
    return NextResponse.json({
      message: 'Email configuration test failed: Missing environment variables.',
      missing: missingVariables,
      details: 'Please ensure all required email environment variables are set in your .env.local file and that the server has been restarted.',
      check_values_except_pass: {
        EMAIL_HOST: EMAIL_HOST || 'Not Set',
        EMAIL_PORT: EMAIL_PORT || 'Not Set',
        EMAIL_USER: EMAIL_USER || 'Not Set',
        ADMINISTRATOR_EMAIL: ADMINISTRATOR_EMAIL || 'Not Set',
        EMAIL_PASS_IS_SET: !!EMAIL_PASS,
      }
    }, { status: 400 });
  }

  return NextResponse.json({
    message: 'Email configuration test successful: All required environment variables are present.',
    config: {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      ADMINISTRATOR_EMAIL,
      EMAIL_PASS_IS_SET: true, // We know it's set if we reach here
    }
  }, { status: 200 });
}
