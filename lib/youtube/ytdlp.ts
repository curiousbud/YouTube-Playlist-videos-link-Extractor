// Thin, dependency-free wrapper around the yt-dlp binary.
//
// yt-dlp powers every download in this app (the single-video endpoint and the
// bulk Excel flow). It supports YouTube plus hundreds of other sites, which is
// why the previous @distube/ytdl-core approach kept breaking: YouTube's player
// script changes faster than the package is updated, and yt-dlp was failing
// with "Could not parse decipher function" → 403. yt-dlp handles that itself.
//
// The binary is not committed to the repo. It is downloaded from the official
// GitHub releases on first use (`npm run setup:ytdlp` pre-downloads it), or a
// pre-downloaded copy can be supplied via the YTDLP_BINARY env var. This module
// is server-only — it spawns child processes and touches the filesystem, so it
// must never be imported from a client component.

import { spawn } from 'node:child_process';
import type { ChildProcessByStdio } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import type { Readable } from 'node:stream';

const execFileAsync = promisify(execFile);

// Official binary downloads, stable URLs pointing at the latest release.
const RELEASES_BASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';

function binaryFileName(platform: NodeJS.Platform = process.platform): string {
  switch (platform) {
    case 'win32':
      return 'yt-dlp.exe';
    case 'darwin':
      // Universal binary for macOS 10.15+.
      return 'yt-dlp_macos';
    default:
      return 'yt-dlp';
  }
}

// Prefer the explicit YTDLP_BINARY override, otherwise keep a copy inside the
// project (gitignored) so the binary survives across restarts on Node hosts.
export function resolveBinaryPath(): string {
  const override = process.env.YTDLP_BINARY;
  if (override && override.trim()) return override.trim();
  return join(process.cwd(), '.yt-dlp', binaryFileName());
}

// A yt-dlp failure with the stderr text captured and an optional HTTP-ish hint
// (403 = age-restricted / bot-checked, 404 = deleted/private/unavailable) so
// callers can surface a friendly message.
export class YtDlpError extends Error {
  statusCode?: number;
  exitCode?: string | number;

  constructor(message: string, details?: { statusCode?: number; exitCode?: string | number }) {
    super(message);
    this.name = 'YtDlpError';
    this.statusCode = details?.statusCode;
    this.exitCode = details?.exitCode;
  }
}

// Map common yt-dlp stderr phrasings to HTTP-ish status hints. The matches are
// deliberately loose: the messages are stable across yt-dlp versions.
function toYtDlpError(raw: unknown): YtDlpError {
  const err = raw as {
    stderr?: string | Buffer;
    stdout?: string | Buffer;
    code?: string | number;
    message?: string;
  };
  const stderr = (err.stderr ?? '').toString().trim();
  const stdout = (err.stdout ?? '').toString().trim();
  const message = stderr || stdout || err.message || 'yt-dlp failed';

  const lower = message.toLowerCase();
  let statusCode: number | undefined;
  if (
    lower.includes('sign in to confirm your age') ||
    lower.includes('sign in to confirm') ||
    (lower.includes('age') && lower.includes('sign in'))
  ) {
    statusCode = 403;
  } else if (
    lower.includes('video unavailable') ||
    lower.includes('private video') ||
    lower.includes('content is not available')
  ) {
    statusCode = 404;
  }

  return new YtDlpError(message, { statusCode, exitCode: err.code });
}

let binaryReady: Promise<string> | null = null;

async function downloadBinary(path: string): Promise<void> {
  const url = `${RELEASES_BASE}/${binaryFileName()}`;
  console.log(`[yt-dlp] Binary not found at ${path}; downloading ${url} …`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`GitHub returned HTTP ${response.status} for ${url}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
  if (process.platform !== 'win32') chmodSync(path, 0o755);
}

/**
 * Resolve the path to the yt-dlp binary, downloading it on first use.
 *
 * Memoized per process: on persistent Node hosts the file exists after the
 * first request, so this is a cheap filesystem check afterwards. Throws a
 * descriptive error when the binary is absent and the download fails (e.g. no
 * outbound access to GitHub), telling the operator how to provide one.
 */
export async function ensureYtDlpBinary(): Promise<string> {
  if (!binaryReady) {
    binaryReady = (async () => {
      const path = resolveBinaryPath();
      if (existsSync(/* turbopackIgnore: true */ path)) return path;
      try {
        await downloadBinary(path);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`[yt-dlp] Failed to download binary: ${detail}`);
        throw new YtDlpError(
          `The yt-dlp binary is missing (${path}) and could not be downloaded automatically ` +
            `(${detail}). Run \`npm run setup:ytdlp\` on a machine with network access, or set ` +
            `the YTDLP_BINARY environment variable to a pre-downloaded copy.`
        );
      }
      return path;
    })();
  }
  return binaryReady;
}

/**
 * Run yt-dlp to completion and resolve with its stdout. Suitable for quick
 * metadata calls (--print / --dump-json). Throws {@link YtDlpError} on any
 * non-zero exit.
 */
export async function runYtDlp(args: string[]): Promise<string> {
  const binary = await ensureYtDlpBinary();
  try {
    const { stdout } = await execFileAsync(binary, args, {
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout;
  } catch (error) {
    throw toYtDlpError(error);
  }
}

/**
 * Spawn yt-dlp and hand back the child so the caller can stream stdout (e.g.
 * `-o -` for a single-file download). The binary must already exist — call
 * {@link ensureYtDlpBinary} first.
 */
export async function spawnYtDlp(
  args: string[]
): Promise<ChildProcessByStdio<null, Readable, Readable>> {
  const binary = await ensureYtDlpBinary();
  return spawn(/* turbopackIgnore: true */ binary, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}
