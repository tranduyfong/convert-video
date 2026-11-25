import "dotenv/config";
import path from "node:path";
function number(name: string, fallback: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(n) || n <= 0)
    throw new Error("Invalid setting: " + name);
  return n;
}
export const cfg = {
  port: number("PORT", 3000),
  concurrent: number("MAX_CONCURRENT", 2),
  waiting: number("MAX_WAITING", 8),
  analyses: number("MAX_ANALYSES", 3),
  duration: Math.min(360, number("MAX_DURATION_SECONDS", 360)),
  bytes: number("MAX_FILE_MB", 256) * 1048576,
  timeout: number("JOB_TIMEOUT_SECONDS", 600) * 1000,
  ttl: number("FILE_TTL_SECONDS", 900) * 1000,
  temp: path.resolve(process.env.TEMP_ROOT || ".tmp"),
  yt: process.env.YT_DLP_PATH || "yt-dlp",
  ff: process.env.FFMPEG_PATH || "ffmpeg",
  probe: process.env.FFPROBE_PATH || "ffprobe",
  secure: (process.env.SITE_URL || "").startsWith("https://"),
};
export class Problem extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const busy = () =>
  new Problem(503, "Máy chủ đang bận. Vui lòng thử lại sau.");
