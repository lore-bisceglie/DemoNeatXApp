import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('neatx_auth');

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// ✅ IMPORTANTE: Assicurati che qui ci sia /dashboard/:path*
export const config = {
  matcher: '/dashboard/:path*',
};