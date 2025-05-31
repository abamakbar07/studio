
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('stockflow-session');
  const { pathname } = request.nextUrl;

  // Allow access to auth pages and API routes (except sensitive ones if needed)
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register') || pathname.startsWith('/api/auth/verify-email') || pathname.startsWith('/api/auth/approve-superuser')) {
    return NextResponse.next();
  }
  
  // If trying to access dashboard/* and no session, redirect to login
  if (pathname.startsWith('/dashboard') && !sessionCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If there is a session and trying to access / (root), redirect to dashboard
  if (pathname === '/' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If no session and trying to access / (root), allow (shows public home page)
  if (pathname === '/' && !sessionCookie) {
    return NextResponse.next();
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files in public folder (e.g. images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
