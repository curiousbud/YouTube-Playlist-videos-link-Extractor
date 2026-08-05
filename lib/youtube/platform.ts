// Pure, client-safe helpers for classifying video URLs by platform.
//
// This module has no dependencies and is safe to import from client components
// (the bulk-download UI uses it to tag each URL with a platform badge). The
// server-side Excel logic in `./excel` reuses the same classification so the
// ZIP folder layout matches what the UI previews.

export const URL_HEADER_CANDIDATES = ['url', 'link', 'links', 'urls', 'video url', 'video link'] as const;

export type PlatformKey =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter_x'
  | 'vimeo'
  | 'other';

// Groups downloads into per-platform folders, mirroring the original Python
// script's `sanitize_platform_folder`.
export function classifyPlatform(url: string): PlatformKey {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter_x';
  if (lower.includes('vimeo.com')) return 'vimeo';
  return 'other';
}

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  twitter_x: 'Twitter / X',
  vimeo: 'Vimeo',
  other: 'Other',
};

// Badge colour per platform, keyed by the same values the ZIP folders use.
export const PLATFORM_BADGE_CLASSES: Record<PlatformKey, string> = {
  youtube: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  instagram: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  tiktok: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  facebook: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  twitter_x: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  vimeo: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
