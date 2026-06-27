import type { VideoData } from '@/lib/youtube/extractor';
import { formatDuration, formatViews } from '@/lib/format';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ImageData {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
}

// Fetch a thumbnail through our same-origin proxy and return it as a data URL,
// or null if it can't be loaded (so an export never fails on one bad image).
// The proxy takes a video ID + quality (not a raw URL), so we parse them out of
// the YouTube thumbnail URL (e.g. https://i.ytimg.com/vi/<id>/<quality>.jpg).
async function fetchImageData(thumbnailUrl: string): Promise<ImageData | null> {
  if (!thumbnailUrl) return null;
  const match = thumbnailUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\/([a-z0-9]+)\.jpg/i);
  if (!match) return null;
  const [, id, quality] = match;
  try {
    const resp = await fetch(`/api/image-proxy?id=${id}&quality=${encodeURIComponent(quality)}`);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format: blob.type.includes('png') ? 'PNG' : 'JPEG' };
  } catch {
    return null;
  }
}

// Resolve an async mapper over items with a bounded concurrency, preserving order.
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function exportToCsv(videos: VideoData[]) {
  const headers = ['Number', 'Title', 'URL', 'Duration', 'Views', 'Upload Date'];
  // RFC 4180: wrap every field in quotes and escape embedded quotes by doubling.
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
  const rows = videos.map((v, idx) =>
    [idx + 1, v.title, v.url, formatDuration(v.duration), v.viewCount, v.uploadDate].map(escape).join(',')
  );

  const csv = [headers.map(escape).join(','), ...rows].join('\r\n');
  // Prefix a UTF-8 BOM so Excel renders non-ASCII titles correctly.
  saveBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), 'youtube-playlist-videos.csv');
}

// ---------------------------------------------------------------------------
// Excel (.xlsx) with embedded thumbnails
// ---------------------------------------------------------------------------

export async function exportToExcel(videos: VideoData[]) {
  const ExcelJS = (await import('exceljs')).default;
  const images = await mapLimit(videos, 6, (v) => fetchImageData(v.thumbnail));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Videos');
  sheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'Thumbnail', key: 'thumb', width: 24 },
    { header: 'Title', key: 'title', width: 50 },
    { header: 'URL', key: 'url', width: 45 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Views', key: 'views', width: 14 },
    { header: 'Upload Date', key: 'date', width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  videos.forEach((v, i) => {
    const row = sheet.addRow({
      num: i + 1,
      thumb: '',
      title: v.title,
      url: v.url,
      duration: formatDuration(v.duration),
      views: v.viewCount,
      date: v.uploadDate,
    });
    row.height = 64;
    row.alignment = { vertical: 'middle', wrapText: true };

    const img = images[i];
    if (img) {
      const imageId = workbook.addImage({
        base64: img.dataUrl,
        extension: img.format === 'PNG' ? 'png' : 'jpeg',
      });
      // Anchor into the "Thumbnail" column (0-indexed col 1) on this row.
      sheet.addImage(imageId, {
        tl: { col: 1.1, row: row.number - 1 + 0.1 },
        ext: { width: 140, height: 78 },
        editAs: 'oneCell',
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'youtube-playlist-videos.xlsx'
  );
}

// ---------------------------------------------------------------------------
// PDF with embedded thumbnails
// ---------------------------------------------------------------------------

export async function exportToPdf(videos: VideoData[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const images = await mapLimit(videos, 6, (v) => fetchImageData(v.thumbnail));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('YouTube Playlist Videos', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${videos.length} videos`, 14, 22);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 26,
    head: [['#', 'Thumbnail', 'Title', 'URL', 'Duration', 'Views', 'Date']],
    body: videos.map((v, i) => [
      i + 1,
      '',
      v.title,
      v.url,
      formatDuration(v.duration),
      formatViews(v.viewCount),
      v.uploadDate,
    ]),
    styles: { fontSize: 7, valign: 'middle', overflow: 'linebreak', cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // blue-600
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 48 },
      3: { cellWidth: 46 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 20 },
    },
    bodyStyles: { minCellHeight: 16 },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 1) return;
      const img = images[data.row.index];
      if (!img) return;
      const w = 24;
      const h = 13.5;
      const x = data.cell.x + (data.cell.width - w) / 2;
      const y = data.cell.y + (data.cell.height - h) / 2;
      try {
        doc.addImage(img.dataUrl, img.format, x, y, w, h);
      } catch {
        // ignore a single image that jsPDF can't decode
      }
    },
  });

  doc.save('youtube-playlist-videos.pdf');
}
