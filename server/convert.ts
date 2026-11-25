import path from "node:path";
import { mkdir, stat, unlink } from "node:fs/promises";
import { cfg, Problem } from "./config.js";
import { baseArgs, type Video, type Pick, type Kind } from "./youtube.js";
import { folder, diskBytes, filename } from "./files.js";
import { run } from "./process.js";
export type Task = { video: Video; kind: Kind; quality: number; pick: Pick };
export type Update = (
  stage: "downloading" | "converting",
  percent?: number,
) => void;
export async function convert(id: string, task: Task, update: Update) {
  const { video, kind, quality, pick } = task;
  const dir = folder(id);
  await mkdir(dir, { mode: 0o700 });
  const ctl = new AbortController();
  const limit = new Problem(413, "Dữ liệu vượt giới hạn dung lượng cho phép.");
  const timer = setTimeout(
    () => ctl.abort(new Problem(504, "Tác vụ đã vượt thời gian cho phép.")),
    cfg.timeout,
  );
  const watch = setInterval(async () => {
    try {
      if ((await diskBytes(dir)) > cfg.bytes * 3) ctl.abort(limit);
    } catch {
      ctl.abort(new Problem(500, "Không thể kiểm tra file tạm."));
    }
  }, 500);
  const download = async (format: string, file: string, single: boolean) => {
    await run(
      cfg.yt,
      [
        ...baseArgs,
        "--no-part",
        "--no-mtime",
        "--fixup",
        "never",
        "--max-filesize",
        String(cfg.bytes),
        "--newline",
        "--progress",
        "--progress-template",
        "download:bytes=%(progress.downloaded_bytes)s/%(progress.total_bytes)s",
        "-f",
        format,
        "-o",
        file,
        "--",
        video.url,
      ],
      ctl.signal,
      (line) => {
        const m = /^bytes=(\d+)\/(\d+)$/.exec(line.trim());
        if (m && Number(m[1]) > cfg.bytes) ctl.abort(limit);
        if (single && m && Number(m[2]) > 0)
          update(
            "downloading",
            Math.min(100, Math.floor((100 * Number(m[1])) / Number(m[2]))),
          );
      },
    );
    const size = await stat(file).catch(() => null);
    if (!size || size.size > cfg.bytes) throw limit;
  };
  try {
    update("downloading");
    const first = path.join(dir, "source.media"),
      second = path.join(dir, "audio.media");
    const dual = !!pick.video && !pick.combined;
    await download(pick.video || pick.audio, first, !dual);
    if (dual) await download(pick.audio, second, false);
    update("converting", 0);
    const out = path.join(dir, "output." + kind);
    const args = [
      "-nostdin",
      "-progress",
      "pipe:1",
      "-nostats",
      "-v",
      "error",
      "-i",
      first,
      ...(dual ? ["-i", second] : []),
      "-map_metadata",
      "-1",
      "-map_chapters",
      "-1",
    ];
    if (kind === "mp4")
      args.push(
        "-map",
        "0:v:0",
        "-map",
        dual ? "1:a:0" : "0:a:0",
        "-vf",
        "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        "-c:v",
        "libx264",
        "-threads",
        "2",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
      );
    else
      args.push(
        "-map",
        "0:a:0",
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        quality + "k",
      );
    let lastPercent = 0;
    await run(cfg.ff, [...args, out], ctl.signal, (line) => {
      const match = /^out_time_us=(\d+)$/.exec(line);
      if (!match) return;
      const fraction = Number(match[1]) / (video.duration * 1_000_000);
      const percent = Math.min(99, Math.floor(fraction * 100));
      if (percent > lastPercent) {
        lastPercent = percent;
        update("converting", percent);
      }
    });
    const size = (await stat(out)).size;
    if (!size || size > cfg.bytes) throw limit;
    const meta = JSON.parse(
      await run(
        cfg.probe,
        ["-v", "error", "-show_streams", "-of", "json", out],
        ctl.signal,
      ),
    );
    const streams = meta.streams as {
      codec_name: string;
      width?: number;
      height?: number;
    }[];
    if (
      !streams.some((s) => s.codec_name === (kind === "mp4" ? "aac" : "mp3")) ||
      (kind === "mp4" &&
        !streams.some(
          (s) =>
            s.codec_name === "h264" &&
            Math.min(s.width || 0, s.height || 0) === quality,
        ))
    )
      throw new Problem(502, "File đầu ra không đạt chất lượng đã chọn.");
    await unlink(first);
    if (dual) await unlink(second);
    return { path: out, size, name: filename(video.title, quality, kind) };
  } finally {
    clearTimeout(timer);
    clearInterval(watch);
  }
}
