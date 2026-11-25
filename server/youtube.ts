import { cfg, Problem } from "./config.js";
import { run } from "./process.js";
type Stream = {
  format_id: string;
  height?: number;
  width?: number;
  acodec?: string;
  vcodec?: string;
  protocol?: string;
  has_drm?: boolean;
  filesize?: number;
};
type Info = {
  id: string;
  title: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  live_status?: string;
  availability?: string;
  formats?: Stream[];
};
export type Kind = "mp4" | "mp3";
export type Pick = { video?: string; audio: string; combined?: boolean };
export const baseArgs = [
  "--ignore-config",
  "--no-playlist",
  "--no-cache-dir",
  "--no-warnings",
  "--socket-timeout",
  "15",
  "--retries",
  "1",
  "--js-runtimes",
  "node",
];
export function inspect(info: Info, url: string) {
  if (info.id !== new URL(url).searchParams.get("v"))
    throw new Problem(422, "Không xác định được video.");
  if (["is_live", "is_upcoming", "post_live"].includes(info.live_status || ""))
    throw new Problem(
      422,
      "Hãy chờ buổi phát trực tiếp kết thúc và bản ghi sẵn sàng.",
    );
  if (info.availability && !["public", "unlisted"].includes(info.availability))
    throw new Problem(422, "Video bị giới hạn quyền truy cập.");
  if (!info.duration || !Number.isFinite(info.duration) || info.duration <= 0)
    throw new Problem(422, "Không xác định được thời lượng video.");
  if (info.duration >= cfg.duration)
    throw new Problem(
      422,
      cfg.duration === 360
        ? "Chỉ hỗ trợ video dưới 6 phút. Hãy chọn video ngắn hơn."
        : `Chỉ hỗ trợ video dưới ${cfg.duration} giây. Hãy chọn video ngắn hơn.`,
    );
  const streams = (info.formats || [])
    .filter(
      (f) =>
        !f.has_drm &&
        ["https", "http"].includes(f.protocol || "") &&
        /^[\w.-]+$/.test(f.format_id) &&
        (!f.filesize || f.filesize <= cfg.bytes),
    )
    .reverse();
  const sound = (f: Stream) => !!f.acodec && f.acodec !== "none";
  const audio =
    streams.find((f) => sound(f) && f.vcodec === "none") || streams.find(sound);
  const picks: Record<number, Pick> = {};
  for (const q of [360, 720, 1080]) {
    const v = streams.find(
      (f) =>
        f.vcodec &&
        f.vcodec !== "none" &&
        Math.min(f.width || Infinity, f.height || Infinity) === q &&
        (sound(f) || audio),
    );
    if (v)
      picks[q] = {
        video: v.format_id,
        audio: sound(v) ? v.format_id : audio!.format_id,
        combined: sound(v),
      };
  }
  if (!audio)
    throw new Problem(422, "Video không có nguồn âm thanh phù hợp để tải.");
  return {
    url,
    title: info.title || "YouTube",
    channel: info.channel || info.uploader || "",
    duration: info.duration,
    thumbnail: "https://i.ytimg.com/vi/" + info.id + "/hqdefault.jpg",
    qualities: Object.keys(picks).map(Number),
    picks,
    audio: audio.format_id,
  };
}
export const analyze = async (url: string, signal: AbortSignal) =>
  inspect(
    JSON.parse(
      await run(
        cfg.yt,
        [...baseArgs, "--dump-single-json", "--skip-download", "--", url],
        signal,
      ),
    ),
    url,
  );
export type Video = Awaited<ReturnType<typeof analyze>>;
export function choose(
  v: Video,
  type: unknown,
  q: unknown,
): { kind: Kind; quality: number; pick: Pick } {
  if (typeof q === "number" && type === "mp4" && v.picks[q])
    return { kind: type, quality: q, pick: v.picks[q] };
  if (typeof q === "number" && type === "mp3" && [128, 192, 320].includes(q))
    return { kind: type, quality: q, pick: { audio: v.audio } };
  throw new Problem(422, "Chất lượng đã chọn không khả dụng.");
}
