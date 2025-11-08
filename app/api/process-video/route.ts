import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoDetails } from '@/lib/youtube/extractor';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const videoData = await fetchVideoDetails(videoId);

    return NextResponse.json({
      success: true,
      video: videoData,
    });
  } catch (error) {
    console.error('Error in process-video:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}
