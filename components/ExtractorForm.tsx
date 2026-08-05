'use client';

import { useState } from 'react';
import VideoList from './VideoList';
import type { VideoData } from '@/lib/youtube/extractor';

interface PlaylistInfo {
  title: string;
  uploader: string;
  videoCount: number;
}

// Matches the YouTube Data API limit of 50 IDs per videos.list call.
const CHUNK_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

  // Hydrate metadata one chunk at a time so the list renders progressively.
  const loadVideos = async (ids: string[]) => {
    for (const group of chunk(ids, CHUNK_SIZE)) {
      try {
        const response = await fetch('/api/process-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds: group }),
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.videos)) {
          setVideos((prev) => [...prev, ...data.videos]);
        }
      } catch (err) {
        console.error('Failed to load a batch of videos:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVideos([]);
    setVideoIds([]);
    setPlaylistInfo(null);

    try {
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

      await loadVideos(data.videoIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-3 py-2.5 sm:px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition text-sm sm:text-base';

  return (
    <div className="py-6 sm:py-10">
      <div className="container mx-auto px-3 sm:px-4 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            YouTube Playlist Video Extractor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Extract video links and metadata from any YouTube playlist
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="link" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Playlist or video URL
              </label>
              <input
                type="text"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className={inputClasses}
                required
              />
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Paste a playlist URL (with a <code>list=</code> parameter) or a single video URL
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
              <div>
                <label htmlFor="viewMode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  View mode
                </label>
                <select
                  id="viewMode"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'paginated' | 'all')}
                  className={inputClasses}
                >
                  <option value="paginated">Paginated view</option>
                  <option value="all">Load all (real-time stream)</option>
                </select>
              </div>

              <div>
                <label htmlFor="perPage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Videos per page
                </label>
                <select
                  id="perPage"
                  value={videosPerPage}
                  onChange={(e) => setVideosPerPage(parseInt(e.target.value, 10))}
                  className={`${inputClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={viewMode === 'all'}
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Extracting…' : 'Extract Videos'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Playlist Info */}
        {playlistInfo && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-600 rounded-xl p-5 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
              {playlistInfo.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {playlistInfo.uploader} · {playlistInfo.videoCount} videos
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
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-slate-700 border-t-blue-600"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading videos…</p>
          </div>
        )}

        {/* Info message when loading more */}
        {loading && videos.length > 0 && videos.length < videoIds.length && (
          <div className="text-center py-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Loading… {videos.length} / {videoIds.length} videos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
