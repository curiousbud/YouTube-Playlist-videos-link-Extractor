import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoDetailsBatch } from '@/lib/youtube/extractor';

const MAX_IDS_PER_REQUEST = 50;

export async function POST(request: NextRequest) {
  try {
    const { videoIds } = await request.json();

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'videoIds (non-empty array) is required' }, { status: 400 });
    }

    if (videoIds.length > MAX_IDS_PER_REQUEST) {
      return NextResponse.json(
        { error: `A maximum of ${MAX_IDS_PER_REQUEST} videoIds is allowed per request` },
        { status: 400 }
      );
    }

    if (!videoIds.every((id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id))) {
      return NextResponse.json({ error: 'videoIds contains an invalid YouTube video ID' }, { status: 400 });
    }

    const videos = await fetchVideoDetailsBatch(videoIds);

    return NextResponse.json({ success: true, videos });
  } catch (error) {
    console.error('Error in process-videos:', error);
    return NextResponse.json({ error: 'Failed to process videos' }, { status: 500 });
  }
}
