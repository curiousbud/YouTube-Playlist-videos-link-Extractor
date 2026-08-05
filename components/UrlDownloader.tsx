'use client';

import { useState } from 'react';
import { classifyPlatform, PLATFORM_LABELS, PLATFORM_BADGE_CLASSES } from '@/lib/youtube/platform';

interface CheckedLink {
  filename: string;
}

const inputClasses =
  'w-full px-3 py-2.5 sm:px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition text-sm sm:text-base';

// Download any video URL (YouTube, Instagram, TikTok, Facebook, Twitter/X,
// Vimeo and hundreds of other sites supported by yt-dlp) as a single file.
export default function UrlDownloader() {
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<CheckedLink | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const checkLink = async () => {
    setError('');
    setChecked(null);
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Please paste a full link that starts with http:// or https://');
      return;
    }
    setChecking(true);
    try {
      const response = await fetch(`/api/download-url/validate?url=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check this link.');
      setChecked({ filename: data.filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check this link.');
    } finally {
      setChecking(false);
    }
  };

  const startDownload = () => {
    if (!checked && !url.trim()) return;
    setDownloading(true);
    // Navigate to the streaming endpoint — the browser saves the attachment
    // straight to disk without buffering it in memory.
    const a = document.createElement('a');
    a.href = `/api/download-url?url=${encodeURIComponent(url.trim())}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setDownloading(false), 1000);
  };

  const platform = classifyPlatform(url);

  return (
    <div className="py-6 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-3xl w-full">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
            Download a video from any site
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-5">
            Paste a link from YouTube, Instagram, TikTok, Facebook, Twitter/X, Vimeo — or any of the
            hundreds of sites supported by yt-dlp — and save the video as a file.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setChecked(null);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  checkLink();
                }
              }}
              placeholder="https://www.instagram.com/reel/..."
              className={inputClasses}
            />
            <button
              type="button"
              onClick={checkLink}
              disabled={checking || downloading}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {checking ? 'Checking…' : 'Check link'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {checked && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {platform && (
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${PLATFORM_BADGE_CLASSES[platform]}`}
                    >
                      {PLATFORM_LABELS[platform]}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ready to download</span>
                </div>
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {checked.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={startDownload}
                disabled={downloading}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors disabled:opacity-60 text-sm"
              >
                {downloading ? 'Starting…' : 'Download'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
