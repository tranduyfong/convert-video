"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Clipboard,
  Link2,
  Search,
  Download,
  Film,
  Music2,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
type Video = {
  analysisId: string;
  thumbnail: string;
  title: string;
  channel: string;
  duration: number;
  qualities: number[];
};
type Status = {
  stage: "queued" | "downloading" | "converting" | "ready" | "failed";
  percent?: number;
  error?: string;
  expires?: number;
  size?: number;
  name?: string;
};
const stages = {
  queued: "Đang chờ xử lý",
  downloading: "Đang tải dữ liệu",
  converting: "Đang chuyển đổi",
  ready: "File đã sẵn sàng",
  failed: "Tác vụ thất bại",
};
async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch("/api/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    cache: "no-store",
  });
  const data = await res
    .json()
    .catch(() => ({ error: "Máy chủ trả về phản hồi không hợp lệ." }));
  if (!res.ok || (data.error && !data.stage))
    throw new Error(data.error || "Không thể hoàn tất yêu cầu.");
  return data;
}
function message(e: unknown) {
  return e instanceof TypeError
    ? "Không kết nối được máy chủ. Hãy thử lại."
    : e instanceof Error
      ? e.message
      : "Đã xảy ra lỗi.";
}
function duration(s: number) {
  return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
}
export default function Tool() {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(""),
    [clipboard, setClipboard] = useState(false),
    [error, setError] = useState("");
  const [video, setVideo] = useState<Video | null>(null),
    [kind, setKind] = useState<"mp4" | "mp3">("mp4"),
    [quality, setQuality] = useState(720);
  const [busy, setBusy] = useState(false),
    [job, setJob] = useState(""),
    [status, setStatus] = useState<Status | null>(null),
    [now, setNow] = useState(0);
  const working =
    !!job && status?.stage !== "ready" && status?.stage !== "failed";
  useEffect(
    () =>
      setClipboard(
        window.isSecureContext &&
          typeof navigator.clipboard?.readText === "function",
      ),
    [],
  );
  useEffect(() => {
    if (!job) return;
    const ctl = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await request<Status>(
          "jobs/" + job,
          undefined,
          ctl.signal,
        );
        if (ctl.signal.aborted) return;
        setStatus(result);
        setNow(Date.now());
        if (result.stage !== "failed" && result.stage !== "ready")
          timer = setTimeout(poll, 1200);
      } catch (e) {
        if (!ctl.signal.aborted) {
          setError(message(e));
          setJob("");
          setStatus(null);
        }
      }
    }
    void poll();
    return () => {
      ctl.abort();
      clearTimeout(timer);
    };
  }, [job]);
  useEffect(() => {
    if (status?.stage !== "ready") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status?.stage]);
  function clear() {
    setError("");
    setJob("");
    setStatus(null);
    setVideo(null);
  }
  function edit(v: string) {
    clear();
    setUrl(v);
  }
  async function paste() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) throw new Error();
      edit(value.trim());
    } catch {
      setError(
        "Không đọc được bộ nhớ tạm. Hãy dán liên kết trực tiếp vào ô liên kết.",
      );
    }
    input.current?.focus();
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || working) return;
    clear();
    if (!url.trim()) {
      setError("Hãy dán link YouTube để phân tích.");
      input.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const v = await request<Video>("analyze", { url });
      setVideo(v);
      setKind(v.qualities.length ? "mp4" : "mp3");
      setQuality(v.qualities.includes(720) ? 720 : v.qualities[0] || 192);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    if (!video || busy || working) return;
    setBusy(true);
    setError("");
    try {
      const j = await request<{ id: string }>("jobs", {
        analysisId: video.analysisId,
        format: kind,
        quality,
      });
      setStatus({ stage: "queued" });
      setJob(j.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const unit = kind === "mp4" ? "p" : " kbps";
  const left = Math.max(0, Math.ceil(((status?.expires || 0) - now) / 1000));
  return (
    <div className="work">
      <form onSubmit={submit}>
        <label htmlFor="video-link">Liên kết YouTube</label>
        <div className="inputrow">
          <div className="field">
            <Link2 size={21} />
            <input
              id="video-link"
              ref={input}
              value={url}
              disabled={busy || working}
              onChange={(e) => edit(e.target.value)}
              placeholder="Dán link YouTube vào đây…"
              autoComplete="off"
              inputMode="url"
              spellCheck={false}
            />
            {clipboard && (
              <button
                className="paste"
                type="button"
                disabled={busy || working}
                onClick={paste}
              >
                <Clipboard size={16} />
                Dán link
              </button>
            )}
          </div>
          <button className="primary" disabled={busy || working}>
            {busy && !video ? (
              <LoaderCircle className="spin" size={19} />
            ) : (
              <Search size={19} />
            )}{" "}
            {busy && !video ? "Đang phân tích" : "Phân tích"}
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {video && (
        <section className="result">
          <div className="videoInfo">
            <img src={video.thumbnail} width="152" height="86" alt="" />
            <div>
              <h2>{video.title}</h2>
              <p>
                {[video.channel, duration(video.duration)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          {!status && (
            <>
              <div role="group" aria-label="Định dạng" className="tabs">
                {(["mp4", "mp3"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={kind === k}
                    disabled={busy}
                    onClick={() => {
                      setKind(k);
                      setQuality(
                        k === "mp3"
                          ? 192
                          : video.qualities.includes(720)
                            ? 720
                            : video.qualities[0] || 0,
                      );
                    }}
                  >
                    {k === "mp4" ? <Film size={18} /> : <Music2 size={18} />}{" "}
                    {k === "mp4" ? "Video MP4" : "Âm thanh MP3"}
                  </button>
                ))}
              </div>
              <div className="qualities" role="group" aria-label="Chất lượng">
                {(kind === "mp3" ? [128, 192, 320] : [360, 720, 1080]).map(
                  (q, i) => {
                    const ok = kind === "mp3" || video.qualities.includes(q);
                    return (
                      <button
                        key={q}
                        disabled={!ok || busy}
                        aria-pressed={quality === q}
                        onClick={() => setQuality(q)}
                      >
                        <strong>
                          {q}
                          {unit}
                        </strong>
                        <small>
                          {ok
                            ? (kind === "mp4"
                                ? ["Tiết kiệm dung lượng", "HD", "Full HD"]
                                : ["Gọn nhẹ", "Cân bằng", "Bitrate cao"])[i]
                            : "Không khả dụng"}
                        </small>
                      </button>
                    );
                  },
                )}
              </div>
              {kind === "mp3" && (
                <p>
                  Bitrate xuất cao hơn không khôi phục được chất lượng đã mất
                  của nguồn.
                </p>
              )}
              <button
                className="primary"
                onClick={start}
                disabled={busy || !quality}
              >
                <Download size={18} /> Tải {kind.toUpperCase()} {quality}
                {unit}
              </button>
            </>
          )}
          {status && (
            <div className="status">
              <strong role="status">
                {stages[status.stage]}
                {typeof status.percent === "number"
                  ? " · " + status.percent + "%"
                  : ""}
              </strong>
              {(working || status.stage === "ready") && (
                <div
                  className="job-progress"
                  role="progressbar"
                  aria-label={stages[status.stage]}
                  aria-valuenow={status.percent}
                >
                  <span style={{ width: status.percent === undefined ? undefined : status.percent + "%" }} />
                </div>
              )}
              {status.error && <p role="alert">{status.error}</p>}
              {status.stage === "ready" && (
                <>
                  <p>
                    {status.name} ·{" "}
                    {((status.size || 0) / 1048576).toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    MB
                  </p>
                  <p>
                    {left
                      ? "Còn " + duration(left) + " để tải file."
                      : "File đã hết hạn."}
                  </p>
                  {left > 0 && (
                    <a
                      className="primary"
                      href={"/api/jobs/" + job + "/download"}
                      download
                    >
                      <Download size={18} />
                      Tải file
                    </a>
                  )}
                </>
              )}
              {!working && (
                <button
                  className="again"
                  onClick={() => {
                    edit("");
                    input.current?.focus();
                  }}
                >
                  <RotateCcw size={16} />
                  Tải video khác
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
