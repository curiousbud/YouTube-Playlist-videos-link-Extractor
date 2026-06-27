import { NextRequest, NextResponse } from 'next/server';

// A YouTube video ID is exactly 11 URL-safe base64 characters.
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

// The thumbnail "quality" segment is restricted to YouTube's known filenames so
// nothing user-controlled can influence the request beyond a fixed token.
const ALLOWED_QUALITIES = new Set([
  'default',
  'mqdefault',
  'hqdefault',
  'sddefault',
  'maxresdefault',
  'hq720',
  '0',
  '1',
  '2',
  '3',
]);

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const qualityParam = request.nextUrl.searchParams.get('quality') ?? 'hqdefault';

  if (!VIDEO_ID_RE.test(id)) {
    return NextResponse.json({ error: 'invalid video id' }, { status: 400 });
  }
  const quality = ALLOWED_QUALITIES.has(qualityParam) ? qualityParam : 'hqdefault';

  // The host and path template are constant string literals; only a
  // regex-validated video ID and an allow-listed quality token are interpolated.
  // There is no user-controlled host, so this cannot be used as an open proxy.
  const target = `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

  try {
    const resp = await fetch(target, { cache: 'force-cache' });
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
