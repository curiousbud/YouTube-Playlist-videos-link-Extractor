// Pure URL-parsing helpers for YouTube links.
//
// This module has zero dependencies and is safe to import from client
// components — unlike `extractor.ts`, which pulls in the Node-only `googleapis`
// package. `extractor.ts` re-exports these so existing server imports such as
// `@/lib/youtube/extractor` keep working unchanged.

// Hostnames that belong to YouTube. youtube-nocookie.com is YouTube's
// privacy-friendly embed domain, and music.youtube.com is its music app.
const YOUTUBE_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

// Parse a possibly scheme-less link into a URL object (null when invalid).
// Users often paste links without the https:// prefix, so we prepend it rather
// than rejecting the input.
function parseUrl(url: string): URL | null {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

// Extracts the playlist ID from a YouTube URL
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Extracts the video ID from a YouTube URL
export function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:v=|\/v\/|youtu\.be\/|\/embed\/|shorts\/|\/watch\?v=)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Validate that a link points at YouTube.
 *
 * Replaced the old regex with real URL parsing: the regex matched any URL that
 * merely contained the tokens `youtube`/`youtu` before `.com`/`.be`, which
 * could accept look-alike domains and odd casing; parsing the hostname against
 * an explicit allowlist is exact.
 */
export function isValidYouTubeUrl(url: string): boolean {
  const parsed = parseUrl(url);
  return parsed !== null && YOUTUBE_HOSTNAMES.has(parsed.hostname.toLowerCase());
}

/**
 * Check if a link is a playlist.
 *
 * A link counts as a playlist only when it actually carries a `list` query
 * parameter with a URL-safe ID. The old substring checks matched any URL
 * containing `list=` or the word "playlist" anywhere — e.g. a video link with
 * an unrelated `?list_type=...` param was wrongly classified as a playlist.
 * Parsing the query string removes those false positives.
 */
export function isPlaylistUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;

  const list = parsed.searchParams.get('list');
  return typeof list === 'string' && /^[a-zA-Z0-9_-]+$/.test(list);
}
