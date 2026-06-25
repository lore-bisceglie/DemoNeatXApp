import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // 🛡️ DEMO MODE: Dashboard pubblica.
  // In questa versione demo non blocchiamo /dashboard con login.

  // 🔄 TRUCCO COMODITÀ: Se sei GIÀ loggato e provi ad andare su /login per sbaglio, 
  // ti teletrasporta direttamente alla dashboard senza farti perdere tempo.
  if (url.pathname === '/login') {
    const authCookie = request.cookies.get('neatx_auth');
    if (authCookie && authCookie.value === 'true') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};