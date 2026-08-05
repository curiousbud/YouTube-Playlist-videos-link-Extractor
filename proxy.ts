// Site-wide access gate for the password-protected deployment.
//
// This is the Next.js 16 "proxy" file (the successor to `middleware`). It runs
// before every matched request and blocks anyone without a valid session
// cookie: page requests are redirected to /login, API requests get a 401.
// Browser requests to the app include the session cookie automatically, so no
// existing client code needs to change.
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifySessionToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Local-dev convenience: without SITE_PASSWORD the gate stays off so
  // `npm run dev` works out of the box. Set SITE_PASSWORD locally to test the
  // login flow, and set it in production to lock the site down (fail-closed:
  // a production build with no password is locked until one is configured).
  if (process.env.NODE_ENV !== 'production' && !process.env.SITE_PASSWORD) {
    return NextResponse.next();
  }

  const sessionValid = await verifySessionToken(request.cookies.get(AUTH_COOKIE)?.value);

  // The login page and the login/logout endpoints must stay reachable without
  // a session; an already-authenticated user visiting /login is sent home.
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname === '/api/login' || pathname === '/api/logout';

  if (isLoginPage || isAuthApi) {
    if (sessionValid && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (sessionValid) {
    return NextResponse.next();
  }

  // Unauthenticated. Return JSON for API calls (a page redirect would confuse
  // fetch callers) and redirect everything else to the login screen.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Run the gate on everything except Next.js internals and static files
  // (JS/CSS bundles, favicon, public images/fonts). Without this the login
  // page's own assets would be blocked.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)'],
};
