'use client';

import { useState } from 'react';
import { VideoData } from '@/lib/youtube/extractor';
import Image from 'next/image';

interface VideoListProps {
  videos: VideoData[];
  totalVideos: number;
  viewMode: 'paginated' | 'all';
  videosPerPage: number;
}

export default function VideoList({ videos, totalVideos, viewMode, videosPerPage }: VideoListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination logic
  const totalPages = Math.ceil(videos.length / videosPerPage);
  const startIdx = (currentPage - 1) * videosPerPage;
  const endIdx = startIdx + videosPerPage;
  const displayedVideos = viewMode === 'paginated' ? videos.slice(startIdx, endIdx) : videos;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllLinks = () => {
    const allLinks = videos.map((v) => v.url).join('\n');
    copyToClipboard(allLinks, 'all-links');
  };

  const copyAllTitles = () => {
    const allTitles = videos.map((v) => v.title).join('\n');
    copyToClipboard(allTitles, 'all-titles');
  };

  const copyAllData = () => {
    const allData = videos
      .map((v, idx) => `${idx + 1}. ${v.title}\n${v.url}`)
      .join('\n\n');
    copyToClipboard(allData, 'all-data');
  };

  const exportToCSV = () => {
    const headers = ['Number', 'Title', 'URL', 'Duration', 'Views', 'Upload Date'];
    const rows = videos.map((v, idx) => [
      idx + 1,
      v.title,
      v.url,
      v.duration,
      v.viewCount,
      v.uploadDate,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youtube-playlist-videos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={copyAllLinks}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {copiedId === 'all-links' ? '✓ Copied!' : 'Copy All Links'}
        </button>
        <button
          onClick={copyAllTitles}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {copiedId === 'all-titles' ? '✓ Copied!' : 'Copy All Titles'}
        </button>
        <button
          onClick={copyAllData}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {copiedId === 'all-data' ? '✓ Copied!' : 'Copy All Data'}
        </button>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Export to CSV
        </button>
      </div>

      {/* Video Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {displayedVideos.length} of {videos.length} videos
        {totalVideos > videos.length && ` (${totalVideos} total)`}
      </div>

      {/* Video Items */}
      <div className="space-y-4">
        {displayedVideos.map((video, idx) => {
          const actualIdx = viewMode === 'paginated' ? startIdx + idx : idx;
          const videoIdForCopy = `video-${actualIdx}`;
          
          return (
            <div
              key={actualIdx}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="shrink-0">
                <div className="relative">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      width={160}
                      height={96}
                      className="w-40 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No thumbnail</span>
                    </div>
                  )}
                  {video.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="grow min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {actualIdx + 1}. {video.title}
                </h3>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline block truncate mb-2"
                >
                  {video.url}
                </a>
                {video.viewCount > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatViews(video.viewCount)} views
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  onClick={() => copyToClipboard(video.url, `${videoIdForCopy}-link`)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                  title="Copy video link"
                >
                  {copiedId === `${videoIdForCopy}-link` ? '✓' : 'Link'}
                </button>
                <button
                  onClick={() => copyToClipboard(video.title, `${videoIdForCopy}-title`)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                  title="Copy video title"
                >
                  {copiedId === `${videoIdForCopy}-title` ? '✓' : 'Title'}
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(`${video.title}\n${video.url}`, `${videoIdForCopy}-both`)
                  }
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                  title="Copy title + link"
                >
                  {copiedId === `${videoIdForCopy}-both` ? '✓' : 'Both'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {viewMode === 'paginated' && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
