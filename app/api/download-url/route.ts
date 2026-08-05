// Download a single video from any site yt-dlp supports by pasting its URL —
// YouTube, Instagram, TikTok, Facebook, Twitter/X, Vimeo and hundreds more.
// Streams the media bytes back to the client as an attachment. Mirrors
// /api/download-video but takes a full URL instead of a YouTube video ID.
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { getUrlDownload } from '@/lib/youtube/download';

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
    const { stream, filename, contentType } = await getUrlDownload(url);

    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
    const encodedFilename = encodeURIComponent(filename);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    request.signal.addEventListener('abort', () => stream.destroy());

    stream.on('error', (err) => {
      console.error('Error while streaming video download:', err);
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    console.error('Error starting download for URL:', error instanceof Error ? error.message : error);

    const message =
      statusCode === 404
        ? 'This media is unavailable (private, deleted, or blocked).'
        : 'Unable to start the download. The link may be unsupported, age-restricted, or unavailable right now.';
    return NextResponse.json({ error: message }, { status: statusCode === 404 ? 404 : 502 });
  }
}
