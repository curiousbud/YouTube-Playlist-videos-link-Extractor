// Preview endpoint for the bulk-download UI: upload the Excel file and get back
// the de-duplicated URL list (with per-platform counts) so the page can show
// what will be downloaded before the heavy yt-dlp work starts.
import { NextRequest, NextResponse } from 'next/server';
import { classifyPlatform } from '@/lib/youtube/platform';
import { readUrlsFromExcel } from '@/lib/youtube/excel';
import type { PlatformKey } from '@/lib/youtube/platform';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_EXCEL_BYTES = 10 * 1024 * 1024;

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
  const sheetName = String(form.get('sheet') ?? '').trim() || undefined;
  const columnName = String(form.get('column') ?? '').trim() || undefined;

  try {
    const parsed = await readUrlsFromExcel(buffer, { sheetName, columnName });

    const platformCounts: Record<PlatformKey, number> = {
      youtube: 0,
      instagram: 0,
      tiktok: 0,
      facebook: 0,
      twitter_x: 0,
      vimeo: 0,
      other: 0,
    };
    for (const url of parsed.urls) {
      platformCounts[classifyPlatform(url)] += 1;
    }

    return NextResponse.json({
      urls: parsed.urls,
      sheetName: parsed.sheetName,
      usedColumn: parsed.usedColumn,
      totalRows: parsed.totalRows,
      invalid: parsed.invalid,
      platformCounts,
      fileName: file.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read URLs from the file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
