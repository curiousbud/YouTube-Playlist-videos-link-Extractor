import ytdl from 'ytdl-core';
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

export interface PlaylistInfo {
  title: string;
  uploader: string;
  videoCount: number;
}

// Cache for video data
const videoCache = new Map<string, { data: VideoData; timestamp: number }>();
const playlistCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract playlist ID from YouTube URL
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch video details using ytdl-core
 */
export async function fetchVideoDetails(videoId: string): Promise<VideoData> {
  // Check cache first
  const cached = videoCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);

    const videoData: VideoData = {
      url: videoUrl,
      title: info.videoDetails.title || 'Unknown Title',
      thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
      duration: parseInt(info.videoDetails.lengthSeconds || '0'),
      viewCount: parseInt(info.videoDetails.viewCount || '0'),
      uploadDate: info.videoDetails.uploadDate || '',
    };

    // Cache the result
    videoCache.set(videoId, { data: videoData, timestamp: Date.now() });

    return videoData;
  } catch (error) {
    // Sanitize videoId for logging (only allow alphanumeric, dash, underscore)
    const sanitizedVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
    console.error('Error fetching video details for video:', sanitizedVideoId, error);
    
    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'Error loading video',
      thumbnail: '',
      duration: 0,
      viewCount: 0,
      uploadDate: '',
    };
  }
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
