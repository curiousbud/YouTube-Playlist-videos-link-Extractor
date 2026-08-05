import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  SESSION_TTL_SECONDS,
  constantTimeEqual,
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/auth';

// Verify the submitted password and issue a signed session cookie.
// The password itself is never stored or logged — it is compared against the
// SITE_PASSWORD environment variable in constant time.
export async function POST(request: NextRequest) {
  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    console.error('SITE_PASSWORD is not configured. Set it before enabling the login gate.');
    return NextResponse.json(
      { error: 'Server is not configured for authentication.' },
      { status: 500 }
    );
  }

  const { password } = await request.json().catch(() => ({}));

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  if (!(await constantTimeEqual(password, expected))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Could not create a session.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, token, {
    ...sessionCookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
