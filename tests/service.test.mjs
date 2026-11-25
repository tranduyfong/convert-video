import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { normalize } from "../dist/url.js";
import { cfg, Problem } from "../dist/config.js";
import { inspect, choose } from "../dist/youtube.js";
import { Queue } from "../dist/queue.js";
import { createApp } from "../dist/app.js";
const id = "YE7VzlLtp-4",
  url = "https://www.youtube.com/watch?v=" + id;
const info = {
  id,
  title: "Bản thử",
  duration: 40,
  formats: [
    {
      format_id: "v",
      height: 720,
      width: 1280,
      vcodec: "h264",
      acodec: "none",
      protocol: "https",
    },
    { format_id: "a", vcodec: "none", acodec: "aac", protocol: "https" },
  ],
};
const video = inspect(info, url);
test("URL parsing, canonicalization and hostname allowlist", () => {
  for (const link of [
    url + "&list=ignore",
    "https://youtu.be/" + id + "?si=ignore",
    "https://youtube.com/shorts/" + id,
  ])
    assert.equal(normalize(link), url);
  for (const link of [
    "https://youtube.com.example/watch?v=" + id,
    "https://youtube.com@evil.example/watch?v=" + id,
    "file://youtube.com/watch?v=" + id,
    "https://example.net",
    "https://youtube.com/playlist?list=123",
    "https://youtu.be/a",
    "not a URL",
  ])
    assert.throws(() => normalize(link));
});
test("source-dependent selection and video restrictions", () => {
  assert.deepEqual(video.qualities, [720]);
  assert.equal(choose(video, "mp4", 720).pick.audio, "a");
  for (const q of [128, 192, 320])
    assert.equal(choose(video, "mp3", q).quality, q);
  assert.throws(() => choose(video, "mp4", 1080));
  assert.throws(() => choose(video, "mp3", 720));
  for (const patch of [
    { live_status: "is_live" },
    { duration: cfg.duration + 1 },
    { availability: "private" },
    { formats: [] },
  ])
    assert.throws(() => inspect({ ...info, ...patch }, url));
});
test("queue concurrency, pressure, failure, expiry and cleanup", async () => {
  const before = {
    concurrent: cfg.concurrent,
    waiting: cfg.waiting,
    ttl: cfg.ttl,
  };
  Object.assign(cfg, { concurrent: 1, waiting: 1, ttl: 15 });
  const releases = [],
    removed = [];
  try {
    const q = new Queue(
      async (id, t, update) => {
        update("downloading");
        await new Promise((r) => releases.push(r));
        if (t.fail) throw new Problem(502, "lỗi thử");
        return { path: "test", name: "file.mp3", size: 42 };
      },
      async (id) => {
        removed.push(id);
      },
    );
    const a = q.add({}),
      b = q.add({ fail: true });
    assert.equal(a.stage, "downloading");
    assert.equal(b.stage, "queued");
    assert.throws(() => q.add({}), { status: 503 });
    assert.throws(() => q.get(a.id, b.token), { status: 404 });
    releases.shift()();
    await new Promise(setImmediate);
    assert.equal(a.stage, "ready");
    assert.equal(b.stage, "downloading");
    releases.shift()();
    await new Promise(setImmediate);
    assert.equal(b.stage, "failed");
    assert.ok(removed.includes(b.id));
    await new Promise((r) => setTimeout(r, 25));
    assert.throws(() => q.get(a.id, a.token), { status: 410 });
    await q.clean();
    assert.ok(removed.includes(a.id));
    assert.throws(() => q.get(a.id, a.token), { status: 404 });
  } finally {
    Object.assign(cfg, before);
  }
});
test("mock HTTP flow through status, access checks, file and errors", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "tg-test-"));
  const file = path.join(dir, "file.mp3");
  await writeFile(file, "fixture");
  const queue = new Queue(
    async () => ({ name: "Âm thanh.mp3", path: file, size: 7 }),
    async () => {},
  );
  const app = createApp(queue, async () => video);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await rm(dir, { force: true, recursive: true });
  });
  const base = "http://127.0.0.1:" + server.address().port + "/api/";
  const post = (p, data) =>
    fetch(base + p, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  assert.equal((await post("analyze", { url: "invalid" })).status, 400);
  const analysis = await (await post("analyze", { url })).json();
  assert.deepEqual(analysis.qualities, [720]);
  const args = {
    analysisId: analysis.analysisId,
    format: "mp4",
    quality: 1080,
  };
  assert.equal((await post("jobs", args)).status, 422);
  const reply = await post("jobs", { ...args, format: "mp3", quality: 192 });
  assert.equal(reply.status, 202);
  const cookie = reply.headers.get("set-cookie").split(";")[0];
  const route = base + "jobs/" + (await reply.json()).id;
  assert.equal((await fetch(route)).status, 404);
  assert.equal((await fetch(route + "/download")).status, 404);
  const status = await fetch(route, { headers: { cookie } });
  assert.match(status.headers.get("x-robots-tag"), /noindex/);
  assert.equal((await status.json()).stage, "ready");
  const download = await fetch(route + "/download", { headers: { cookie } });
  assert.equal(await download.text(), "fixture");
  assert.match(download.headers.get("content-disposition"), /filename\*/);
});
