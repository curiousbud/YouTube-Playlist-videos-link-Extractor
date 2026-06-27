import { NextRequest, NextResponse } from 'next/server';

// Only YouTube's thumbnail CDNs may be proxied — prevents this route from being
// abused as an open proxy / SSRF vector.
const ALLOWED_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com', 'i9.ytimg.com']);

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 400 });
  }

  try {
    const resp = await fetch(target.toString(), { cache: 'force-cache' });
    if (!resp.ok) {
      return NextResponse.json({ error: 'upstream fetch failed' }, { status: 502 });
    }
    const body = await resp.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'fetch error' }, { status: 502 });
  }
}
