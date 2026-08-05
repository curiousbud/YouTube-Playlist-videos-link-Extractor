// Server-only helpers for the bulk-download flow: parsing an uploaded .xlsx
// into a de-duplicated list of video URLs and formatting the download report.
//
// This is a faithful port of the Python `video_downloader.py` logic:
//   - auto-detect the URL column by header name ("url", "link", "links",
//     "urls", "video url", "video link") — case-insensitive
//   - optional explicit sheet / column override
//   - skip the first row when it looks like a header
//   - de-duplicate, keep only http(s):// values
// Uses `exceljs` (already a dependency) instead of openpyxl.

import ExcelJS from 'exceljs';
import { URL_HEADER_CANDIDATES } from './platform';

export interface ExcelParseOptions {
  sheetName?: string;
  columnName?: string;
}

export interface ExcelParseResult {
  urls: string[];
  sheetName: string;
  /** Header text of the column that was used (or "first column" when auto-detection fell back). */
  usedColumn: string;
  /** Rows considered as data (after the header row is skipped, if any). */
  totalRows: number;
  /** Non-empty rows that were skipped because they were duplicates or not http(s):// links. */
  invalid: number;
}

// Return the index of the column holding URLs. Mirrors the Python
// `find_url_column`: explicit column first, then header-name detection, then a
// first-column fallback.
function findUrlColumn(headers: (string | number | null | undefined)[], requested?: string): number {
  const normalized = headers.map((h) => String(h ?? '').trim().toLowerCase());

  if (requested) {
    const target = requested.trim().toLowerCase();
    const index = normalized.indexOf(target);
    if (index === -1) {
      throw new Error(`Column '${requested}' not found. Available columns: ${headers.join(', ')}`);
    }
    return index;
  }

  for (const candidate of URL_HEADER_CANDIDATES) {
    const index = normalized.indexOf(candidate);
    if (index !== -1) return index;
  }

  // No recognizable header — assume the first column holds URLs and there is
  // no header row.
  return 0;
}

/**
 * Read the URL column out of an uploaded .xlsx buffer.
 *
 * `exceljs` rows are 1-indexed (`row.values[0]` is always empty), so the raw
 * values are sliced to a plain 0-indexed array before being fed to
 * `findUrlColumn` / the data scan.
 */
export async function readUrlsFromExcel(
  buffer: Buffer,
  options: ExcelParseOptions = {}
): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs declares its own ambient `Buffer extends ArrayBuffer` that shadows
  // the @types/node Buffer, so resolve the exact parameter type instead of
  // guessing at which `Buffer` to cast to.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const sheet = options.sheetName
    ? workbook.getWorksheet(options.sheetName)
    : workbook.worksheets[0];
  if (!sheet) {
    throw new Error(
      options.sheetName
        ? `Sheet '${options.sheetName}' not found.`
        : 'The workbook contains no sheets.'
    );
  }

  const rows: (string | number | null | undefined)[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as Array<unknown>).slice(1).map((cell) => {
      if (cell instanceof Date) return cell.toISOString();
      return cell as string | number | null | undefined;
    });
    rows.push(values);
  });
  if (rows.length === 0) return { urls: [], sheetName: sheet.name, usedColumn: '', totalRows: 0, invalid: 0 };

  const firstRow = rows[0];
  const columnIndex = findUrlColumn(firstRow, options.columnName);

  // Decide whether the first row is a header or actual data.
  const firstCell = String(firstRow[columnIndex] ?? '').trim().toLowerCase();
  const looksLikeHeader = (URL_HEADER_CANDIDATES as readonly string[]).includes(firstCell);
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  const urls: string[] = [];
  const seen = new Set<string>();
  let invalid = 0;

  for (const row of dataRows) {
    if (columnIndex >= row.length) continue;
    const value = row[columnIndex];
    if (value === null || value === undefined) continue;
    const url = String(value).trim();
    if (url && !seen.has(url) && /^https?:\/\//i.test(url)) {
      seen.add(url);
      urls.push(url);
    } else if (url) {
      invalid += 1;
    }
  }

  const usedColumn = looksLikeHeader ? String(firstRow[columnIndex]) : options.columnName?.trim() || 'first column';
  return { urls, sheetName: sheet.name, usedColumn, totalRows: dataRows.length, invalid };
}

/**
 * Format the report file that ships inside the download ZIP, mirroring the
 * Python script's `write_report`.
 */
export function buildDownloadReport(succeeded: string[], failed: { url: string; error: string }[]): string {
  const lines = [
    `Succeeded: ${succeeded.length}`,
    `Failed: ${failed.length}`,
    '',
  ];
  if (failed.length > 0) {
    lines.push('--- Failed URLs ---');
    for (const { url, error } of failed) {
      lines.push(url, `  Error: ${error}`, '');
    }
  }
  if (succeeded.length > 0) {
    lines.push('--- Succeeded URLs ---');
    for (const url of succeeded) lines.push(url);
  }
  return lines.join('\n') + '\n';
}
