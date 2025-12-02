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
  // Threshold for switching to batch loading
  const BATCH_THRESHOLD = 20;
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

      // Use batch loading only if playlist exceeds threshold
      if (data.videoIds.length > BATCH_THRESHOLD) {
        await loadRemainingVideos(data.videoIds);
      } else {
        await loadVideos(data.videoIds);
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
    <div className="min-h-0 py-2">
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            YouTube Playlist Video Extractor
          </h1>
          <p className="text-gray-700 text-base">
            Extract video links and metadata from YouTube playlists
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-[0_2px_16px_0_rgba(0,0,0,0.7)] border border-gray-200 dark:border-gray-700 p-2 sm:p-4 mb-4 w-full max-w-full">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                YouTube Playlist or Video URL
              </label>
              <input
                type="text"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full px-2 py-2 sm:px-4 border border-gray-300 dark:border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow shadow-sm dark:shadow dark:focus:shadow-lg focus:shadow-md text-xs sm:text-base"
                required
              />
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-300">
                Enter a YouTube playlist URL (with list= parameter) or individual video URL
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
              <div>
                <label htmlFor="viewMode" className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                  View Mode
                </label>
                <select
                  id="viewMode"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'paginated' | 'all')}
                  className="w-full px-2 py-2 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow shadow-sm dark:shadow dark:focus:shadow-lg focus:shadow-md text-xs sm:text-base"
                >
                  <option value="paginated">Paginated View</option>
                  <option value="all">Load All (Real-time Stream)</option>
                </select>
              </div>

              <div>
                <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Videos per Page
                </label>
                <select
                  id="perPage"
                  value={videosPerPage}
                  onChange={(e) => setVideosPerPage(parseInt(e.target.value))}
                  className="w-full px-2 py-2 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow shadow-sm dark:shadow dark:focus:shadow-lg focus:shadow-md text-xs sm:text-base"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-2 sm:px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
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
          <div className="bg-linear-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-md p-6 mb-8">
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
