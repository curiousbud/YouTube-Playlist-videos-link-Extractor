'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { classifyPlatform, PLATFORM_LABELS, PLATFORM_BADGE_CLASSES } from '@/lib/youtube/platform';
import type { PlatformKey } from '@/lib/youtube/platform';

interface ParseResult {
  urls: string[];
  sheetName: string;
  usedColumn: string;
  totalRows: number;
  invalid: number;
  platformCounts: Record<PlatformKey, number>;
  fileName: string;
}

const inputClasses =
  'w-full px-3 py-2.5 sm:px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition text-sm sm:text-base';

const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

export default function BulkDownloadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cookiesFile, setCookiesFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState('');
  const [columnName, setColumnName] = useState('');
  const [quality, setQuality] = useState('best');
  const [retries, setRetries] = useState(2);
  const [groupByPlatform, setGroupByPlatform] = useState(true);

  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cookiesInputRef = useRef<HTMLInputElement>(null);

  const buildFormData = (): FormData => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (cookiesFile) formData.append('cookies', cookiesFile);
    formData.append('sheet', sheetName);
    formData.append('column', columnName);
    formData.append('quality', quality);
    formData.append('retries', String(retries));
    formData.append('groupByPlatform', String(groupByPlatform));
    return formData;
  };

  const reviewUrls = async () => {
    setError('');
    setDone(false);
    setParsed(null);
    if (!file) {
      setError('Please choose an Excel (.xlsx) file first.');
      return;
    }
    setParsing(true);
    try {
      const response = await fetch('/api/bulk-download/parse', {
        method: 'POST',
        body: buildFormData(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not read the file.');
      setParsed(data as ParseResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the file.');
    } finally {
      setParsing(false);
    }
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    setError('');
    setDone(false);
    if (!parsed) return;
    setDownloading(true);
    try {
      const response = await fetch('/api/bulk-download/process', {
        method: 'POST',
        body: buildFormData(),
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json') || !response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Bulk download failed (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      saveBlob(blob, 'downloads.zip');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const platformEntries = parsed
    ? (Object.entries(parsed.platformCounts) as [PlatformKey, number][]).filter(([, count]) => count > 0)
    : [];

  return (
    <div className="py-6 sm:py-10">
      <div className="container mx-auto px-3 sm:px-4 max-w-3xl w-full">
        {/* Back to home / single-download page */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M11 4L5 10l6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to playlist extractor
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
            Bulk Download from Excel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Upload a spreadsheet of video links — YouTube, Instagram, TikTok, Facebook, Twitter/X,
            Vimeo and hundreds more — and download every video as a ZIP
          </p>
        </div>

        {/* Upload + options */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6">
          {/* Excel file drop zone */}
          <div className="mb-5">
            <span className={labelClasses}>Excel file with video links</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setParsed(null);
                  setDone(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) {
                  setFile(dropped);
                  setParsed(null);
                  setDone(false);
                }
              }}
              className={`w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500/70'
              }`}
            >
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {file ? file.name : 'Click or drop an .xlsx file here'}
              </span>
              <span className="block mt-1 text-xs text-slate-400 dark:text-slate-500">
                The URL column is detected automatically by header (&quot;url&quot;, &quot;link&quot;,
                &quot;urls&quot;…) or falls back to the first column
              </span>
            </button>
          </div>

          {/* Optional: cookies */}
          <div className="mb-5">
            <span className={labelClasses}>
              Cookies file <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
            </span>
            <input
              ref={cookiesInputRef}
              type="file"
              accept=".txt,.cookies"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) setCookiesFile(selected);
              }}
            />
            <button
              type="button"
              onClick={() => cookiesInputRef.current?.click()}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:border-blue-500/70 transition text-left"
            >
              {cookiesFile ? `Using: ${cookiesFile.name}` : 'Optional: cookies.txt for private / age-gated content'}
            </button>
          </div>

          {/* Advanced options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div>
              <label htmlFor="sheet" className={labelClasses}>
                Sheet name <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                id="sheet"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Default: first sheet"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="column" className={labelClasses}>
                Column header <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                id="column"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="Default: auto-detect"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="quality" className={labelClasses}>
                Quality
              </label>
              <input
                type="text"
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                placeholder="best"
                className={inputClasses}
              />
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                yt-dlp format selector, e.g. <code>best</code> or <code>bestvideo+bestaudio</code>. MP4 is
                preferred when available.
              </p>
            </div>
            <div>
              <label htmlFor="retries" className={labelClasses}>
                Retries per video
              </label>
              <input
                type="number"
                id="retries"
                min={0}
                max={10}
                value={retries}
                onChange={(e) => setRetries(parseInt(e.target.value, 10) || 0)}
                className={inputClasses}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={groupByPlatform}
              onChange={(e) => setGroupByPlatform(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Sort downloads into per-platform folders inside the ZIP
            </span>
          </label>

          <button
            type="button"
            onClick={reviewUrls}
            disabled={parsing || downloading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {parsing ? 'Reading URLs…' : 'Review URLs'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {done && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 text-sm">
              The ZIP was saved to your Downloads folder. It contains the videos in per-platform folders
              (when enabled) plus a <code>download_report.txt</code> listing what succeeded and what failed.
            </div>
          )}
        </div>

        {/* Parsed URL preview */}
        {parsed && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {parsed.urls.length} unique URL{parsed.urls.length === 1 ? '' : 's'} found
              </h2>
              {platformEntries.map(([platform, count]) => (
                <span
                  key={platform}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${PLATFORM_BADGE_CLASSES[platform]}`}
                >
                  {PLATFORM_LABELS[platform]}: {count}
                </span>
              ))}
            </div>
            <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
              Sheet: <code>{parsed.sheetName}</code> · Column: <code>{parsed.usedColumn}</code> ·{' '}
              {parsed.totalRows} data rows{parsed.invalid > 0 ? `, ${parsed.invalid} skipped (duplicates / non-http)` : ''}
            </p>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 mb-5">
              {parsed.urls.map((url, idx) => {
                const platform = classifyPlatform(url);
                return (
                  <div key={`${url}-${idx}`} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 w-8 text-right">
                      {idx + 1}
                    </span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${PLATFORM_BADGE_CLASSES[platform]}`}>
                      {PLATFORM_LABELS[platform]}
                    </span>
                    <span className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-300">{url}</span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={downloadAll}
              disabled={downloading || parsing}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {downloading ? 'Downloading… please keep this tab open' : 'Download all (ZIP)'}
            </button>
            {downloading && (
              <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
                Each video is downloaded in order with up to {retries} retries. Large batches can take a
                while — the ZIP streams to your browser when everything is ready.
              </p>
            )}
          </div>
        )}

        {/* Requirements note */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <strong>Requirements:</strong> downloading runs on the server via yt-dlp, so the site must be
          hosted on a Node.js host with a writable filesystem and outbound network access (self-hosted,
          Render, Railway, Docker…). On Vercel&apos;s free/hobby plan function responses are capped and the
          filesystem is read-only, so bulk downloads are not supported there. The yt-dlp binary is
          downloaded automatically on first use, or place your own copy and set the{' '}
          <code>YTDLP_BINARY</code> environment variable.
        </div>
      </div>
    </div>
  );
}
