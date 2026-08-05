// URL parsing lives in ./url (pure, client-safe) and is re-exported here so
// server imports like `@/lib/youtube/extractor` keep working unchanged.
export * from './url';

// Simple in-memory cache for playlist video IDs
const playlistCache = new Map<string, { data: string[]; timestamp: number }>();

// PlaylistInfo type for playlist metadata
export interface PlaylistInfo {
  id?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  uploader: string;
  videoCount: number;
}
// import ytdl from 'ytdl-core';
import { google } from 'googleapis';
import type { youtube_v3 } from 'googleapis/build/src/apis/youtube/v3';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export interface VideoData {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  viewCount: number;
  uploadDate: string;
}

// Simple in-memory cache for video details
const videoCache = new Map<string, { data: VideoData; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Max IDs the YouTube Data API accepts per videos.list call (1 quota unit each).
const VIDEO_BATCH_SIZE = 50;

// Parse an ISO 8601 duration (e.g., PT1H2M10S) into total seconds.
function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match.map((v) => Number(v) || 0);
  return h * 3600 + m * 60 + s;
}

// Map a raw YouTube videos.list item into our VideoData shape.
function toVideoData(video: youtube_v3.Schema$Video): VideoData {
  const id = video.id || '';
  return {
    url: `https://www.youtube.com/watch?v=${id}`,
    title: video.snippet?.title || 'Unknown Title',
    thumbnail:
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.default?.url ||
      '',
    duration: parseISODuration(video.contentDetails?.duration || ''),
    viewCount: Number(video.statistics?.viewCount || '0'),
    uploadDate: video.snippet?.publishedAt?.split('T')[0] || '',
  };
}

// Placeholder for videos that are private, deleted, or otherwise unavailable.
function placeholderVideo(videoId: string): VideoData {
  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: 'Error loading video',
    thumbnail: '',
    duration: 0,
    viewCount: 0,
    uploadDate: '',
  };
}

/**
 * Fetch details for many videos at once using YouTube Data API v3.
 *
 * Results are returned in the same order as `videoIds`, with a placeholder
 * inserted for any video the API omits (private/deleted), so callers can rely
 * on positional alignment with their input.
 */
export async function fetchVideoDetailsBatch(videoIds: string[]): Promise<VideoData[]> {
  if (videoIds.length === 0) return [];

  // Serve cache hits immediately; only request the rest from the API.
  const now = Date.now();
  const resolved = new Map<string, VideoData>();
  const missing: string[] = [];

  for (const id of videoIds) {
    const cached = videoCache.get(id);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      resolved.set(id, cached.data);
    } else if (!resolved.has(id) && !missing.includes(id)) {
      missing.push(id);
    }
  }

  if (missing.length > 0 && !process.env.YOUTUBE_API_KEY) {
    console.error('YouTube API key is not set. Please set YOUTUBE_API_KEY environment variable.');
  } else {
    for (let i = 0; i < missing.length; i += VIDEO_BATCH_SIZE) {
      const chunk = missing.slice(i, i + VIDEO_BATCH_SIZE);
      try {
        const resp = await youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: chunk,
        });
        for (const video of resp.data.items || []) {
          if (!video.id) continue;
          const data = toVideoData(video);
          videoCache.set(video.id, { data, timestamp: Date.now() });
          resolved.set(video.id, data);
        }
      } catch (error) {
        const sanitized = chunk.map((id) => id.replace(/[^a-zA-Z0-9_-]/g, '')).join(',');
        console.error('Error fetching video details for videos:', sanitized, error);
      }
    }
  }

  return videoIds.map((id) => resolved.get(id) || placeholderVideo(id));
}

/**
 * Fetch video details for a single video using YouTube Data API v3.
 */
export async function fetchVideoDetails(videoId: string): Promise<VideoData> {
  const [video] = await fetchVideoDetailsBatch([videoId]);
  return video;
}

/**
 * Fetch playlist video IDs using YouTube Data API v3
 */
export async function fetchPlaylistVideos(playlistId: string): Promise<string[]> {
  // Check cache first
  const cached = playlistCache.get(playlistId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.error('YouTube API key is not set. Please set YOUTUBE_API_KEY environment variable.');
      return [];
    }

    const videoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const resp = await youtube.playlistItems.list({
        part: ['contentDetails'],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const response: youtube_v3.Schema$PlaylistItemListResponse = resp.data;

      if (response.items) {
        for (const item of response.items) {
          const videoId = item.contentDetails?.videoId;
          if (videoId) {
            videoIds.push(videoId);
          }
        }
      }

      nextPageToken = response.nextPageToken || undefined;
    } while (nextPageToken);

    // Cache the result
    playlistCache.set(playlistId, { data: videoIds, timestamp: Date.now() });

    return videoIds;
  } catch (error) {
    // Sanitize playlistId for logging (only allow alphanumeric, dash, underscore)
    const sanitizedPlaylistId = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
    console.error('Error fetching playlist videos for playlist:', sanitizedPlaylistId, error);
    return [];
  }
}

/**
 * Fetch playlist info using YouTube Data API v3
 */
export async function fetchPlaylistInfo(playlistId: string): Promise<PlaylistInfo | null> {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.error('YouTube API key is not set.');
      return null;
    }
    const resp = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      id: [playlistId],
    });

    const response: youtube_v3.Schema$PlaylistListResponse | undefined = resp.data;

    if (response && response.items && response.items.length > 0) {
      const playlist = response.items[0];
      return {
        title: playlist.snippet?.title || 'Unknown Playlist',
        uploader: playlist.snippet?.channelTitle || 'Unknown',
        videoCount: playlist.contentDetails?.itemCount || 0,
      };
    }
    return null;
  } catch (error) {
    // Sanitize playlistId for logging (only allow alphanumeric, dash, underscore)
    const sanitizedPlaylistId = playlistId.replace(/[^a-zA-Z0-9_-]/g, '');
    console.error('Error fetching playlist info for playlist:', sanitizedPlaylistId, error);
    return null;
  }
}
