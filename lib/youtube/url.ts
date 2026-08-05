// Pure URL-parsing helpers for YouTube links.
//
// This module has zero dependencies and is safe to import from client
// components — unlike `extractor.ts`, which pulls in the Node-only `googleapis`
// package. `extractor.ts` re-exports these so existing server imports such as
// `@/lib/youtube/extractor` keep working unchanged.

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
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.+$/;
  return youtubeRegex.test(url);
}

/**
 * Check if URL is a playlist
 */
export function isPlaylistUrl(url: string): boolean {
  return (
    url.toLowerCase().includes('playlist') ||
    url.toLowerCase().includes('list=') ||
    url.includes('&list=') ||
    url.includes('?list=')
  );
}
