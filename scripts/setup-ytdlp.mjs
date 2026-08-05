// Pre-download the yt-dlp binary so the first download request does not have
// to fetch it. Run via `npm run setup:ytdlp`.
import { ensureYtDlpBinary } from '../lib/youtube/ytdlp.ts';

try {
  const path = await ensureYtDlpBinary();
  console.log(`yt-dlp ready at ${path}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
