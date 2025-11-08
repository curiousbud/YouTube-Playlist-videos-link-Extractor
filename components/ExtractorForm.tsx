'use client';

import { useState } from 'react';
import VideoList from './VideoList';
import { VideoData } from '@/lib/youtube/extractor';

interface PlaylistInfo {
  title: string;
  uploader: string;
  videoCount: number;
}

export default function ExtractorForm() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [viewMode, setViewMode] = useState<'paginated' | 'all'>('paginated');
  const [videosPerPage, setVideosPerPage] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVideos([]);
    setPlaylistInfo(null);

    try {
      // Extract playlist/video
      const response = await fetch('/api/extract-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract playlist');
      }

      setVideoIds(data.videoIds);
      
      if (data.playlistInfo) {
        setPlaylistInfo(data.playlistInfo);
      }

      // Load initial batch of videos
      const initialBatch = data.videoIds.slice(0, Math.min(5, data.videoIds.length));
      await loadVideos(initialBatch);

      // If view mode is 'all', load remaining videos in background
      if (viewMode === 'all' && data.videoIds.length > 5) {
        loadRemainingVideos(data.videoIds.slice(5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (ids: string[]) => {
    const videoPromises = ids.map(async (videoId) => {
      try {
        const response = await fetch('/api/process-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });
        const data = await response.json();
        return data.video;
      } catch (err) {
        console.error(`Failed to load video ${videoId}:`, err);
        return null;
      }
    });

    const loadedVideos = await Promise.all(videoPromises);
    const validVideos = loadedVideos.filter((v): v is VideoData => v !== null);
    
    setVideos((prev) => [...prev, ...validVideos]);
  };

  const loadRemainingVideos = async (ids: string[]) => {
    // Load remaining videos in batches
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await loadVideos(batch);
      // Small delay between batches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            YouTube Playlist Video Extractor
          </h1>
          <p className="text-gray-600">
            Extract video links and metadata from YouTube playlists
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Playlist or Video URL
              </label>
              <input
                type="text"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a YouTube playlist URL (with list= parameter) or individual video URL
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="viewMode" className="block text-sm font-medium text-gray-700 mb-2">
                  View Mode
                </label>
                <select
                  id="viewMode"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'paginated' | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="paginated">Paginated View</option>
                  <option value="all">Load All (Real-time Stream)</option>
                </select>
              </div>

              <div>
                <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-2">
                  Videos per Page
                </label>
                <select
                  id="perPage"
                  value={videosPerPage}
                  onChange={(e) => setVideosPerPage(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={viewMode === 'all'}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Extracting...' : 'Extract Videos'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Playlist Info */}
        {playlistInfo && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">{playlistInfo.title}</h2>
            <p className="text-purple-100">
              by {playlistInfo.uploader} • {playlistInfo.videoCount} videos
            </p>
          </div>
        )}

        {/* Video List */}
        {videos.length > 0 && (
          <VideoList
            videos={videos}
            totalVideos={videoIds.length}
            viewMode={viewMode}
            videosPerPage={videosPerPage}
          />
        )}

        {/* Loading indicator */}
        {loading && videos.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        )}

        {/* Info message when loading more */}
        {loading && videos.length > 0 && videos.length < videoIds.length && (
          <div className="text-center py-4">
            <p className="text-gray-600">
              Loading... {videos.length} / {videoIds.length} videos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
