import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { getVideoDownload } from '@/lib/youtube/download';

// Downloads are handled by yt-dlp (see lib/youtube/download.ts) — the same
// engine the bulk Excel downloader uses. It needs full Node APIs (child
// processes, streams) and this route streams a potentially large body, so it
// must run on the Node.js runtime — never Edge.
export const runtime = 'nodejs';

// Streaming responses are inherently dynamic; opt out of any static caching.
export const dynamic = 'force-dynamic';

// Same validation as /api/image-proxy: a YouTube video ID is exactly 11
// URL-safe base64 characters. Rejecting anything else up front keeps the
// downstream URL construction free of user-controlled input.
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';

  if (!VIDEO_ID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    // Resolve the media stream from YouTube (the slow, fallible part of the
    // request — see getVideoDownload for the failure modes).
    const { stream, filename, contentType } = await getVideoDownload(id);

    // RFC 6266 dual filename: an ASCII fallback for clients that do not
    // understand `filename*`, plus a UTF-8 encoded one that preserves the
    // original (possibly non-ASCII) title in modern browsers.
    const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_');
    const encodedFilename = encodeURIComponent(filename);

    // Convert the Node `Readable` into a WHATWG `ReadableStream`, the body type
    // `Response` accepts. The App Router forwards chunks to the client as they
    // arrive instead of buffering the whole file in memory.
    const webStream = Readable.toWeb(stream);

    // If the client navigates away or cancels the download, stop pulling bytes
    // from YouTube; otherwise the server would stream into a dead socket until
    // the video finished.
    request.signal.addEventListener('abort', () => stream.destroy());

    // Surface mid-stream failures (throttling, connection drops) without
    // crashing the serverless function.
    stream.on('error', (err) => {
      console.error('Error while streaming video download:', err);
    });

    return new Response(webStream as unknown as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
        // Downloads are single-use; never let a shared cache serve someone
        // else's (IP-bound) media URL.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // yt-dlp reports the failure reason on stderr; the wrapper maps the common
    // ones (age-gated → 403, deleted/private → 404) onto `statusCode`.
    const statusCode = (error as { statusCode?: number }).statusCode;
    // Sanitize before logging, per repo convention.
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    console.error('Error starting video download:', sanitizedId, error instanceof Error ? error.message : error);

    const message =
      statusCode === 404
        ? 'This video is unavailable (private, deleted, or blocked).'
        : 'Unable to start the download. The video may be age-restricted or unavailable right now.';
    return NextResponse.json({ error: message }, { status: statusCode === 404 ? 404 : 502 });
  }
}
