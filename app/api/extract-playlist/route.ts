import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import Link from '@/lib/mongodb/models/Link';
import {
  extractPlaylistId,
  extractVideoId,
  fetchPlaylistVideos,
  fetchPlaylistInfo,
  isValidYouTubeUrl,
  isPlaylistUrl,
} from '@/lib/youtube/extractor';

export async function POST(request: NextRequest) {
  try {
    const { link } = await request.json();

    if (!link) {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 });
    }

    if (!isValidYouTubeUrl(link)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Save link to database
    const newLink = new Link({ link });
    await newLink.save();

    // Check if it's a playlist or single video
    const isPlaylist = isPlaylistUrl(link);

    if (isPlaylist) {
      const playlistId = extractPlaylistId(link);
      
      if (!playlistId) {
        return NextResponse.json({ error: 'Invalid playlist URL' }, { status: 400 });
      }

      // Fetch playlist info and video IDs
      const [playlistInfo, videoIds] = await Promise.all([
        fetchPlaylistInfo(playlistId),
        fetchPlaylistVideos(playlistId),
      ]);

      if (!videoIds || videoIds.length === 0) {
        return NextResponse.json({ 
          error: 'No videos found in playlist or API key not configured' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        type: 'playlist',
        playlistInfo,
        videoIds,
        totalVideos: videoIds.length,
      });
    } else {
      // Single video
      const videoId = extractVideoId(link);
      
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        type: 'video',
        videoIds: [videoId],
        totalVideos: 1,
      });
    }
  } catch (error) {
    console.error('Error in extract-playlist:', error);
    return NextResponse.json(
      { error: 'Failed to process YouTube link' },
      { status: 500 }
    );
  }
}
