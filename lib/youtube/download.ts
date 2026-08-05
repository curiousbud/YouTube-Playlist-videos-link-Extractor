// Downloads stream video files directly from YouTube's media servers using the
// maintained `@distube/ytdl-core` fork (the plain `ytdl-core` package is no
// longer maintained). This module is server-only: it depends on Node streams
// and must never be imported from a client component.
import ytdl from '@distube/ytdl-core';
import { Readable } from 'node:stream';

// A single video download: a readable Node stream of the media bytes plus the
// metadata the HTTP layer needs to present the stream as a downloadable file.
export interface VideoDownload {
  stream: Readable;
  filename: string;
  contentType: string;
}

// Reduce a video title to a safe filesystem filename. YouTube titles routinely
// contain characters that are illegal in filenames (`\/:*?"<>|`), so they are
// stripped; long titles are truncated so the OS never rejects the name, and
// "video" is used as a fallback when nothing remains after sanitising.
export function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, 150) || 'video';
}

/**
 * Resolve the download stream for a single video.
 *
 * ytdl-core scrapes the watch page and never touches the YouTube Data API, so
 * this feature consumes no API quota and needs no extra configuration. The
 * returned `VideoDownload` exposes the highest-quality *progressive* format —
 * a single MP4 that already contains both video and audio tracks (typically
 * 360p/720p). Adaptive (DASH) formats carry video and audio separately and
 * would require an ffmpeg merge, which this serverless-friendly codebase does
 * not ship, so they are deliberately excluded.
 *
 * Note for serverless hosts (e.g. Vercel free/hobby): function responses are
 * capped (about 4.5 MB), so large videos will fail there. This feature is meant
 * for Node.js hosts that can stream arbitrary-size bodies (self-hosted, Render,
 * Railway, etc.).
 */
export async function getVideoDownload(videoId: string): Promise<VideoDownload> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // getInfo() fetches the video page and every available format. This is the
  // network call most likely to fail (private, deleted, or age-restricted
  // videos), so callers should treat it as the fallible boundary.
  const info = await ytdl.getInfo(url);

  // Pick the best progressive format (video + audio in one file) and open a
  // readable stream of the media bytes.
  const stream = ytdl.downloadFromInfo(info, {
    filter: (format) => format.hasVideo && format.hasAudio,
    quality: 'highest',
  });

  return {
    stream,
    filename: `${sanitizeFilename(info.videoDetails.title)}.mp4`,
    contentType: 'video/mp4',
  };
}
