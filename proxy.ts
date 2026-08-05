// API origin guard.
//
// Pages remain completely public.  Every request to `/api/*` is checked: the
// browser's `Origin` (for fetch / XHR) or `Referer` (for navigations such as
// the download anchor) must point at the same hostname the request was made to.
// This blocks cross-site scripts and tools (curl, Postman, other projects)
// while keeping the site itself usable by anyone.
//
// Requests without both headers (e.g. server-to-server) are blocked too.
// Local development on `localhost` works because the browser still sends the
// matching Origin/Referer.
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages are always public — only /api/* routes are guarded.
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const targetHost = request.nextUrl.hostname;

  // The browser sends `Origin` for fetch/XHR and `Referer` for navigations
  // (e.g. clicking a download link). Either matching the target hostname
  // proves the request came from this site itself.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).hostname === targetHost) return NextResponse.next();
    } catch {
      // Malformed Origin — fall through to block.
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      if (new URL(referer).hostname === targetHost) return NextResponse.next();
    } catch {
      // Malformed Referer — fall through to block.
    }
  }

  return NextResponse.json(
    { error: 'API access is restricted to the site itself.' },
    { status: 403 }
  );
}

// Match only /api/* — static assets and pages skip the guard entirely.
export const config = {
  matcher: ['/api/:path*'],
};
