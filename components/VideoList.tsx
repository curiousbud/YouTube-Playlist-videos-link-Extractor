'use client';

import { useState } from 'react';
import { VideoData } from '@/lib/youtube/extractor';
import { extractVideoId } from '@/lib/youtube/url';
import { formatDuration, formatViews } from '@/lib/format';
import { exportToCsv, exportToExcel, exportToPdf } from '@/lib/export/exporters';
import Image from 'next/image';

interface VideoListProps {
  videos: VideoData[];
  totalVideos: number;
  viewMode: 'paginated' | 'all';
  videosPerPage: number;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export default function VideoList({ videos, totalVideos, viewMode, videosPerPage }: VideoListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadAllActive, setDownloadAllActive] = useState(false);

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

  const copyAllLinks = () => copyToClipboard(videos.map((v) => v.url).join('\n'), 'all-links');
  const copyAllTitles = () => copyToClipboard(videos.map((v) => v.title).join('\n'), 'all-titles');
  const copyAllData = () =>
    copyToClipboard(videos.map((v, idx) => `${idx + 1}. ${v.title}\n${v.url}`).join('\n\n'), 'all-data');

  // Kick off a browser download for one video by navigating to the streaming
  // endpoint with a detached anchor. The route responds with
  // `Content-Disposition: attachment`, so the page never leaves the SPA while
  // the file saves to the user's Downloads folder.
  const triggerDownload = (video: VideoData) => {
    const videoId = extractVideoId(video.url);
    if (!videoId) return;
    const a = document.createElement('a');
    a.href = `/api/download-video?id=${encodeURIComponent(videoId)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Download the full result set one video at a time. Browsers throttle
  // programmatic downloads, so each one is spaced out; Chrome/Safari may still
  // ask the user to allow "multiple downloads" on the first run.
  const downloadAll = async () => {
    if (videos.length === 0) return;
    setDownloadAllActive(true);
    try {
      for (let i = 0; i < videos.length; i++) {
        triggerDownload(videos[i]);
        if (i < videos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 750));
        }
      }
    } finally {
      setDownloadAllActive(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setMenuOpen(false);
    setExporting(format);
    try {
      if (format === 'csv') exportToCsv(videos);
      else if (format === 'excel') await exportToExcel(videos);
      else await exportToPdf(videos);
    } catch (err) {
      console.error(`Failed to export as ${format}:`, err);
      alert(`Sorry, the ${format.toUpperCase()} export failed. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  const bulkBtn =
    'px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors';
  const copyBtn =
    'px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors';

  const exportOptions: { format: ExportFormat; label: string; hint: string }[] = [
    { format: 'csv', label: 'CSV', hint: 'Spreadsheet text' },
    { format: 'excel', label: 'Excel (.xlsx)', hint: 'With thumbnails' },
    { format: 'pdf', label: 'PDF', hint: 'With thumbnails' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
      {/* Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button onClick={copyAllLinks} className={bulkBtn}>
          {copiedId === 'all-links' ? '✓ Copied' : 'Copy all links'}
        </button>
        <button onClick={copyAllTitles} className={bulkBtn}>
          {copiedId === 'all-titles' ? '✓ Copied' : 'Copy all titles'}
        </button>
        <button onClick={copyAllData} className={bulkBtn}>
          {copiedId === 'all-data' ? '✓ Copied' : 'Copy all data'}
        </button>
        <button
          onClick={downloadAll}
          disabled={downloadAllActive || videos.length === 0}
          className="px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          title="Download every video in the current result set as MP4"
        >
          {downloadAllActive ? 'Downloading all…' : 'Download all'}
        </button>

        {/* Export dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            disabled={exporting !== null}
            className="px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {exporting ? `Exporting ${exporting.toUpperCase()}…` : 'Export'}
            {!exporting && (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <>
              {/* Click-away backdrop */}
              <button
                className="fixed inset-0 z-10 cursor-default"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
              >
                {exportOptions.map((opt) => (
                  <button
                    key={opt.format}
                    role="menuitem"
                    onClick={() => handleExport(opt.format)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{opt.label}</span>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Count */}
      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Showing {displayedVideos.length} of {videos.length} videos
        {totalVideos > videos.length && ` (${totalVideos} total)`}
      </div>

      {/* Video Items */}
      <div className="space-y-3">
        {displayedVideos.map((video, idx) => {
          const actualIdx = viewMode === 'paginated' ? startIdx + idx : idx;
          const videoIdForCopy = `video-${actualIdx}`;

          return (
            <div
              key={`${video.url}-${actualIdx}`}
              className="flex gap-4 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
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
                    <div className="w-40 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400 text-xs">No thumbnail</span>
                    </div>
                  )}
                  {video.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="grow min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 truncate">
                  {actualIdx + 1}. {video.title}
                </h3>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate mb-2"
                >
                  {video.url}
                </a>
                {video.viewCount > 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {formatViews(video.viewCount)} views
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  onClick={() => triggerDownload(video)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  title="Download video as MP4"
                >
                  Download
                </button>
                <button
                  onClick={() => copyToClipboard(video.url, `${videoIdForCopy}-link`)}
                  className={copyBtn}
                  title="Copy video link"
                >
                  {copiedId === `${videoIdForCopy}-link` ? '✓' : 'Link'}
                </button>
                <button
                  onClick={() => copyToClipboard(video.title, `${videoIdForCopy}-title`)}
                  className={copyBtn}
                  title="Copy video title"
                >
                  {copiedId === `${videoIdForCopy}-title` ? '✓' : 'Title'}
                </button>
                <button
                  onClick={() => copyToClipboard(`${video.title}\n${video.url}`, `${videoIdForCopy}-both`)}
                  className={copyBtn}
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
            className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 text-sm text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
