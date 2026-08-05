# CLAUDE.md

Guidance for working in this repository.

## Project

YouTube Playlist Video Extractor — a Next.js (App Router) web app that extracts
video URLs and metadata from a YouTube playlist (or a single video) using the
YouTube Data API v3. Optional MongoDB persistence records submitted links.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm start        # Run the production build
npm run lint     # ESLint (eslint-config-next)
```

There is no test suite. Validate changes with `npm run lint` and `npm run build`.

## Environment

Copy `.env.example` to `.env.local`:

- `YOUTUBE_API_KEY` — **required** for playlist/video metadata (YouTube Data API v3).
- `MONGODB_URI` — optional. When unset, all DB code is a no-op (see `isMongoEnabled`).
- `REDIS_URL`, `NEXT_PUBLIC_API_URL` — optional.

## Architecture

Request flow:

1. **`components/ExtractorForm.tsx`** (client) — submits the URL to
   `POST /api/extract-playlist`, receives an ordered list of `videoIds`, then
   hydrates metadata in chunks via `POST /api/process-videos`, appending results
   progressively so the list renders as it loads.
2. **`app/api/extract-playlist/route.ts`** — validates the URL, optionally saves
   it to MongoDB, and returns `videoIds` (+ `playlistInfo` for playlists).
3. **`app/api/process-videos/route.ts`** — batch-resolves up to 50 video IDs per
   request to one YouTube API call.
4. **`components/VideoList.tsx`** (client) — renders results with pagination /
   stream view, per-item and bulk copy actions, and a CSV / Excel / PDF export menu.
5. **`app/api/download-video/route.ts`** — streams a single video as an MP4
   attachment via `@distube/ytdl-core` (see `lib/youtube/download.ts`). Node
   runtime only; works on Node hosts, not on Vercel free/hobby's ~4.5 MB
   response cap.

Exports live in **`lib/export/exporters.ts`** (`exportToCsv` / `exportToExcel` /
`exportToPdf`). ExcelJS and jsPDF are **dynamically imported** inside the export
functions so they stay out of the initial bundle. The Excel and PDF exporters
embed thumbnails, fetched through **`app/api/image-proxy/route.ts`** — a
same-origin proxy that takes a validated video ID + allow-listed quality token
(never a raw URL) and builds the request URL from constants (SSRF guard). Shared
display formatters (`formatDuration`, `formatViews`) are in **`lib/format.ts`**.

Core logic lives in **`lib/youtube/`**:
- `url.ts` (pure, client-safe) — `extractPlaylistId` / `extractVideoId` / `isPlaylistUrl`
  / `isValidYouTubeUrl`. Re-exported from `extractor.ts`; client components must
  import URL helpers from `url.ts`, never `extractor.ts` (which pulls in the
  Node-only `googleapis` and breaks the client bundle).
- `extractor.ts` — `fetchPlaylistInfo` / `fetchPlaylistVideos` (playlist metadata
  + paginated ID listing), `fetchVideoDetails` / `fetchVideoDetailsBatch` (video
  metadata; **batch is preferred** — the `videos.list` endpoint accepts up to 50
  IDs for 1 quota unit).

In-memory `Map` caches (`videoCache`, `playlistCache`, TTL = `CACHE_DURATION`,
1 hour) sit in `extractor.ts`. They reset on cold start — fine for a single
serverless instance, not shared across instances.

Downloads: `lib/youtube/download.ts` exposes `getVideoDownload(videoId)`, which
resolves the highest-quality **progressive** MP4 (video + audio in one file;
DASH formats are excluded because merging them needs ffmpeg) and returns a Node
`Readable` + safe filename. The route converts it with `Readable.toWeb` and
streams it back. Downloading consumes no YouTube Data API quota (ytdl-core
scrapes the watch page), but may 403 on age-restricted/bot-checked videos.

MongoDB: `lib/mongodb/connection.ts` exposes a cached `connectDB` (no-op when
`MONGODB_URI` is unset) and `isMongoEnabled`. The only model is
`lib/mongodb/models/Link.ts`.

## Conventions

- **Resilience over throwing**: metadata fetchers return placeholder objects
  (`title: 'Error loading video'`, empty arrays) instead of throwing, so one bad
  video never breaks a whole playlist. Preserve this — keep input/output order stable.
- **Order matters**: `fetchVideoDetailsBatch` returns results in the same order as
  the input IDs, inserting placeholders for private/deleted videos that the API omits.
- **Never log raw user IDs**: sanitize with `.replace(/[^a-zA-Z0-9_-]/g, '')` before logging.
- **Styling**: Tailwind CSS v4. Theme is driven by CSS variables in
  `app/globals.css`; dark mode toggles the `.dark` class on `<html>`
  (`app/theme.tsx`). The palette is a restrained blue + slate "premium minimal"
  scheme — add new accents sparingly and prefer the existing `--primary` /
  neutral slate tokens over introducing new colors.
- **Images**: `next.config.ts` sets `images.unoptimized: true` so thumbnails load
  straight from YouTube's CDN and never consume Vercel's metered Image
  Optimization quota. Don't re-enable optimization without a plan for that quota.
- **Heavy export libs** (ExcelJS, jsPDF) must stay behind dynamic `import()` calls
  inside the export functions — never import them at module top level.
- **`package.json` `overrides`** pin `postcss` and `uuid` to patched versions to
  clear transitive Dependabot advisories (Next bundles old postcss; exceljs pins
  old uuid). exceljs uses `require('uuid').v4`, which uuid v11 supports — keep
  these overrides unless the upstream deps ship fixes, and re-run `npm audit`
  after dependency bumps.
- Path alias `@/*` maps to the repo root.
