// Video downloads, powered by yt-dlp.
//
// The previous implementation used `@distube/ytdl-core`, which scraped YouTube's
// watch page and re-implemented the player-script decipher logic. When YouTube
// ships a new player script that ytdl-core cannot parse ("Could not parse
// decipher function"), every download fails with HTTP 403. yt-dlp maintains its
// own extractors and is not tied to that player logic, so it keeps working —
// and it supports hundreds of sites (YouTube, Instagram, TikTok, Facebook,
// Twitter/X, Vimeo, …), not just YouTube. This module is server-only: it spawns
// a child process and must never be imported from a client component.
import { Readable } from 'node:stream';
import { runYtDlp, spawnYtDlp, YtDlpError } from './ytdlp';

// Filename pattern from the original Python script, expressed as a yt-dlp
// output template: "{uploader} - {title} [{id}].{ext}" (title truncated to 150
// bytes so filesystem-safe names stay short).
export const YTDLP_FILENAME_TEMPLATE = '%(uploader)s - %(title).150B [%(id)s].%(ext)s';

// Prefer a single MP4 that already contains both video and audio tracks
// (progressive format), falling back to whatever `quality` resolves to. This
// mirrors the Python script's `{quality}[ext=mp4]/{quality}` and needs no
// ffmpeg merge, which this serverless-friendly codebase does not ship.
export const YTDLP_FORMAT_SELECTOR = 'best[ext=mp4]/best';

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  m4a: 'audio/mp4',
  m4v: 'video/x-m4v',
  mp3: 'audio/mpeg',
  m4b: 'audio/mp4',
  flac: 'audio/flac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

function contentTypeForExtension(ext: string): string {
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export interface VideoDownload {
  stream: Readable;
  filename: string;
  contentType: string;
}

// Resolve the filename yt-dlp would produce for a URL without downloading it,
// using the same format selector as the actual download so the extension in the
// HTTP header always matches the bytes that follow.
async function resolveFilename(url: string): Promise<string> {
  const printed = (
    await runYtDlp([
      url,
      '--skip-download',
      '-f',
      YTDLP_FORMAT_SELECTOR,
      '--print',
      YTDLP_FILENAME_TEMPLATE,
      '--no-warnings',
    ])
  )
    .trim()
    .split('\n')[0];

  // yt-dlp falls back to a generic filename if the template fields are empty;
  // guard against a blank reply anyway.
  return (printed && printed.trim()) || 'video.mp4';
}

/**
 * Resolve the download stream for any URL yt-dlp supports.
 *
 * Two yt-dlp calls:
 *   1. `--print <template>` resolves the filename (and extension) without
 *      downloading anything, so `Content-Disposition` is known up front.
 *   2. `-o -` streams the media bytes to stdout, which the route forwards to
 *      the client. Progress noise goes to stderr, keeping stdout pure.
 *
 * Note for serverless hosts (e.g. Vercel free/hobby): function responses are
 * capped (about 4.5 MB) and spawning the yt-dlp binary requires a writable
 * filesystem, so large videos will fail there. This feature is meant for
 * Node.js hosts that can stream arbitrary-size bodies (self-hosted, Render,
 * Railway, etc.).
 */
export async function getUrlDownload(url: string): Promise<VideoDownload> {
  const filename = await resolveFilename(url);
  const ext = (filename.slice(filename.lastIndexOf('.') + 1) || 'mp4').toLowerCase();
  const contentType = contentTypeForExtension(ext);

  const child = await spawnYtDlp([
    url,
    '-f',
    YTDLP_FORMAT_SELECTOR,
    '-o',
    '-',
    '--no-progress',
    '--no-warnings',
  ]);

  // The stream is stdout; keep stderr drained so the child never blocks on a
  // full pipe, and surface real errors without killing the response.
  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim();
    if (text) console.error('[yt-dlp]', text);
  });

  const stream = child.stdout;
  // When the client aborts (route destroys the stream) or the download
  // finishes, make sure the yt-dlp child process is reaped too — otherwise an
  // aborted request would keep pulling from the source site in the background.
  stream.on('close', () => {
    if (!child.killed) child.kill();
  });

  return { stream, filename, contentType };
}

/**
 * Resolve just the metadata (filename + platform) for a URL, used by the
 * "check link" step in the UI before the real download starts. Throws
 * {@link YtDlpError} when yt-dlp does not recognise the site or the media is
 * unavailable.
 */
export async function getUrlMetadata(url: string): Promise<{ filename: string; platform: string }> {
  const filename = await resolveFilename(url);
  let platform = '';
  try {
    const host = new URL(url).hostname.toLowerCase();
    platform = host.replace(/^www\./, '');
  } catch {
    platform = '';
  }
  return { filename, platform };
}

/**
 * Convenience wrapper: resolve the download stream for a single YouTube video
 * by ID (used by the playlist result list).
 */
export async function getVideoDownload(videoId: string): Promise<VideoDownload> {
  return getUrlDownload(`https://www.youtube.com/watch?v=${videoId}`);
}

export { YtDlpError };
