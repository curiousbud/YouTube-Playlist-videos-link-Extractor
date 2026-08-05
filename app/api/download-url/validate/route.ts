// Lightweight "check this link" step for the any-site downloader: resolve the
// filename + platform for a URL (metadata only, nothing is downloaded) so the
// UI can confirm the link is downloadable before starting the stream.
import { NextRequest, NextResponse } from 'next/server';
import { getUrlMetadata } from '@/lib/youtube/download';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_URL_LENGTH = 2048;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') ?? '';

  if (!/^https?:\/\//i.test(url) || url.length > MAX_URL_LENGTH) {
    return NextResponse.json(
      { error: 'Please provide a valid http(s) video URL.' },
      { status: 400 }
    );
  }

  try {
    const { filename, platform } = await getUrlMetadata(url);
    return NextResponse.json({ filename, platform });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const message =
      statusCode === 404
        ? 'This media is unavailable (private, deleted, or blocked).'
        : 'This link could not be recognised as a downloadable video. Check the URL or try a different link.';
    return NextResponse.json({ error: message }, { status: statusCode === 404 ? 404 : 422 });
  }
}
