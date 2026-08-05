import { NextResponse } from 'next/server';
import { AUTH_COOKIE, sessionCookieOptions } from '@/lib/auth';

// Clear the session cookie. The proxy gate keeps the login page reachable, so
// after logout the user lands back on /login.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, '', {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
