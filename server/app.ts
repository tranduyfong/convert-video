import express, { type ErrorRequestHandler, type Request } from "express";
import path from "node:path";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { cfg, Problem, busy } from "./config.js";
import { normalize } from "./url.js";
import { analyze, choose, type Video } from "./youtube.js";
import { Queue } from "./queue.js";
export function createApp(queue = new Queue(), inspect = analyze) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY);
  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "no-referrer");
    next();
  });
  const api = express.Router();
  app.use("/api", api);
  api.use((_req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.set("Cache-Control", "no-store");
    next();
  });
  const limit = (max: number) =>
    rateLimit({
      windowMs: 60000,
      limit: max,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Quá nhiều yêu cầu. Hãy thử lại sau một phút." },
    });
  api.use(limit(150), express.json({ limit: "4kb" }));
  const cache = new Map<string, { video: Video; expires: number }>();
  let running = 0;
  api.post("/analyze", limit(12), async (req, res) => {
    const url = normalize(req.body?.url);
    if (running >= cfg.analyses) throw busy();
    running++;
    const ctl = new AbortController();
    const timer = setTimeout(
      () => ctl.abort(new Problem(504, "Phân tích quá thời gian cho phép.")),
      Math.min(cfg.timeout, 60000),
    );
    try {
      const v = await inspect(url, ctl.signal);
      const key = randomUUID();
      for (const [id, item] of cache)
        if (item.expires <= Date.now()) cache.delete(id);
      if (cache.size >= 300) cache.delete(cache.keys().next().value!);
      cache.set(key, { video: v, expires: Date.now() + 600000 });
      res.json({
        analysisId: key,
        title: v.title,
        channel: v.channel,
        duration: v.duration,
        thumbnail: v.thumbnail,
        qualities: v.qualities,
      });
    } finally {
      running--;
      clearTimeout(timer);
    }
  });
  api.post("/jobs", limit(12), (req, res) => {
    const item = cache.get(req.body?.analysisId);
    if (!item || item.expires <= Date.now())
      throw new Problem(
        410,
        "Phiên phân tích đã hết hạn. Hãy nhấn Phân tích lại.",
      );
    const selection = choose(item.video, req.body?.format, req.body?.quality);
    const job = queue.add({ video: item.video, ...selection });
    res.cookie("tg_job", job.token, {
      path: "/api/jobs/" + job.id,
      httpOnly: true,
      secure: cfg.secure,
      sameSite: "strict",
    });
    res.status(202).json({ id: job.id });
  });
  function access(req: Request) {
    const cookie = (req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("tg_job="));
    return queue.get(String(req.params.id), cookie?.slice(7) || "");
  }
  api.get("/jobs/:id", (req, res) => {
    const j = access(req);
    res.json({
      stage: j.stage,
      percent: j.percent,
      error: j.error,
      name: j.file?.name,
      size: j.file?.size,
      expires: j.expires,
    });
  });
  api.get("/jobs/:id/download", (req, res, next) => {
    const j = access(req);
    if (j.stage !== "ready" || !j.file)
      throw new Problem(409, "File chưa sẵn sàng.");
    j.readers++;
    res.download(j.file.path, j.file.name, { dotfiles: "allow" }, (err) => {
      j.readers--;
      if (err) next(err);
    });
  });
  api.use((_req, _res, next) => next(new Problem(404, "API không tồn tại.")));
  const web = path.resolve("frontend/out");
  app.use(
    express.static(web, {
      index: "index.html",
      redirect: true,
      setHeaders: (res, file) => {
        if (
          file.endsWith("404.html") ||
          file.includes(path.sep + "404" + path.sep)
        )
          res.setHeader("X-Robots-Tag", "noindex");
      },
    }),
  );
  app.use((_req, res) => {
    res
      .set("X-Robots-Tag", "noindex")
      .status(404)
      .sendFile(path.join(web, "404.html"));
  });
  const errors: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status =
      err instanceof Problem
        ? err.status
        : err.type === "entity.parse.failed"
          ? 400
          : err.type === "entity.too.large"
            ? 413
            : 500;
    res
      .set("X-Robots-Tag", "noindex")
      .status(status)
      .json({
        error:
          err instanceof Problem
            ? err.message
            : status === 400
              ? "Dữ liệu không hợp lệ."
              : "Không thể hoàn tất yêu cầu.",
      });
  };
  app.use(errors);
  return app;
}
