// Bulk download: upload an Excel file of video URLs and receive a ZIP archive
// of the downloaded videos, sorted into per-platform folders, plus a
// download_report.txt summarising what succeeded and what failed.
//
// Faithful port of the Python `video_downloader.py`:
//   - Excel parsing with auto-detected URL column (see lib/youtube/excel.ts)
//   - yt-dlp per URL with {quality}[ext=mp4]/{quality} format preference,
//     per-video retries, optional cookies.txt, platform subfolders, and the
//     "{uploader} - {title} [{id}].{ext}" filename pattern
//   - a download_report.txt in the archive root
//
// Requires a Node.js host with a writable filesystem and outbound network
// access (yt-dlp binary + video downloads). Not suitable for Vercel's
// serverless function limits; see README/DEPLOYMENT notes.
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';
import { classifyPlatform } from '@/lib/youtube/platform';
import { buildDownloadReport, readUrlsFromExcel } from '@/lib/youtube/excel';
import { runYtDlp, ensureYtDlpBinary, YtDlpError } from '@/lib/youtube/ytdlp';
import { YTDLP_FILENAME_TEMPLATE } from '@/lib/youtube/download';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Uploads are capped at 10 MB — a spreadsheet of links is tiny; anything larger
// is almost certainly not a URL list.
const MAX_EXCEL_BYTES = 10 * 1024 * 1024;

// Politeness delay between downloads (mirrors the Python script).
const SLEEP_BETWEEN_MS = 1000;
const RETRY_SLEEP_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Read one multipart text field with a default fallback.
function textField(form: FormData, name: string, fallback: string): string {
  const value = form.get(name);
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

// Download a single URL into `outdir` with the given format selector and retry
// budget. Mirrors the Python script's retry loop (total attempts = retries + 1).
async function downloadOne(
  url: string,
  outdir: string,
  formatSelector: string,
  retries: number,
  cookiesPath: string | null
): Promise<{ ok: boolean; error?: string }> {
  const args = [
    url,
    '-f',
    formatSelector,
    '-o',
    join(/* turbopackIgnore: true */ outdir, YTDLP_FILENAME_TEMPLATE),
    '--retries',
    String(retries),
    '--fragment-retries',
    String(retries),
  ];
  if (cookiesPath) args.push('--cookiefile', cookiesPath);

  let lastError: YtDlpError | Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await runYtDlp(args);
      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        console.warn(`[bulk] Retry ${attempt + 1}/${retries} for ${url}: ${lastError.message}`);
        await sleep(RETRY_SLEEP_MS);
      }
    }
  }
  return { ok: false, error: lastError?.message ?? 'Unknown yt-dlp error' };
}

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing Excel file. Please upload a .xlsx file.' }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a .xlsx workbook (Excel 2007+).' },
      { status: 400 }
    );
  }
  if (file.size === 0 || file.size > MAX_EXCEL_BYTES) {
    return NextResponse.json(
      { error: `The file must be between 1 byte and ${MAX_EXCEL_BYTES / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const quality = textField(form, 'quality', 'best');
  const retries = Math.min(Math.max(Number(textField(form, 'retries', '2')) || 2, 0), 10);
  const groupByPlatform = textField(form, 'groupByPlatform', 'true') !== 'false';
  const sheetName = textField(form, 'sheet', '');
  const columnName = textField(form, 'column', '');

  // Optional cookies.txt for private / age-gated content.
  const cookiesField = form.get('cookies');
  const cookiesFile = cookiesField instanceof File && cookiesField.size > 0 ? cookiesField : null;

  let workDir: string | null = null;
  try {
    const parsed = await readUrlsFromExcel(buffer, {
      sheetName: sheetName || undefined,
      columnName: columnName || undefined,
    });
    if (parsed.urls.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid URLs found in the file. Check the sheet/column name and that cells start with http(s)://',
        },
        { status: 400 }
      );
    }

    // Fail fast when the yt-dlp binary cannot be prepared (e.g. no outbound
    // network or a read-only filesystem) instead of half-processing the batch.
    await ensureYtDlpBinary();

    workDir = await mkdtemp(join(/* turbopackIgnore: true */ tmpdir(), 'bulk-download-'));
    if (cookiesFile) {
      const cookiesPath = join(workDir, 'cookies.txt');
      await writeFile(cookiesPath, Buffer.from(await cookiesFile.arrayBuffer()));
    }

    const formatSelector = `${quality}[ext=mp4]/${quality}`;
    const succeeded: string[] = [];
    const failed: { url: string; error: string }[] = [];

    const cookiesPath = cookiesFile ? join(workDir, 'cookies.txt') : null;

    for (let i = 0; i < parsed.urls.length; i++) {
      const url = parsed.urls[i];
      const platform = groupByPlatform ? classifyPlatform(url) : '';
      const targetDir = platform ? join(/* turbopackIgnore: true */ workDir, platform) : workDir;
      await mkdir(targetDir, { recursive: true });

      console.log(`[bulk] [${i + 1}/${parsed.urls.length}] Downloading: ${url}`);
      const result = await downloadOne(url, targetDir, formatSelector, retries, cookiesPath);
      if (result.ok) {
        succeeded.push(url);
        console.log(`[bulk] [${i + 1}/${parsed.urls.length}] OK`);
      } else {
        failed.push({ url, error: result.error ?? 'Unknown error' });
        console.error(`[bulk] [${i + 1}/${parsed.urls.length}] FAILED: ${result.error}`);
      }

      if (i < parsed.urls.length - 1) await sleep(SLEEP_BETWEEN_MS);
    }

    await writeFile(join(/* turbopackIgnore: true */ workDir, 'download_report.txt'), buildDownloadReport(succeeded, failed), 'utf8');

    // Stream the archive directly from disk — nothing is buffered in memory.
    const archive = archiver('zip', { zlib: { level: 6 } });
    const body = new PassThrough();
    archive.on('warning', (error) => console.warn('[bulk] Zip warning:', error));
    archive.on('error', (error) => body.destroy(error));
    archive.pipe(body);
    archive.directory(workDir, false);

    // Remove the temp download folder once the browser has the whole archive
    // (or the client disconnects mid-stream).
    body.on('close', () => {
      archive.abort();
      rm(workDir as string, { recursive: true, force: true }).catch(() => undefined);
    });

    // Kick off archiving without awaiting: finalize() only resolves once the
    // destination drains, and the destination only starts draining after the
    // Response below is returned and Next reads the body — awaiting here would
    // deadlock the request.
    void archive.finalize().catch((error) => body.destroy(error));

    const webStream = Readable.toWeb(body) as unknown as ReadableStream;
    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="downloads.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bulk download failed';
    console.error('[bulk] Failed:', message);
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
