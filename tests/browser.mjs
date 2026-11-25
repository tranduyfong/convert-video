// Run after npm run build. Set BROWSER_PATH to an installed Chromium executable.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { createApp } from "../dist/app.js";
import { Queue } from "../dist/queue.js";
import { Problem } from "../dist/config.js";
import { inspect } from "../dist/youtube.js";
const videoId = "YE7VzlLtp-4";
const url = "https://youtu.be/" + videoId;
let analyses = 0;
let advanceWorker;
const server = createApp(
  new Queue(
    async (_id, _task, update) => {
      update("downloading", 42);
      await new Promise(resolve => { advanceWorker = resolve; });
      update("converting", 65);
      await new Promise(resolve => { advanceWorker = resolve; });
      throw new Problem(502, "Lỗi thử nghiệm chuyển đổi.");
    },
    async () => {},
  ),
  async (canonical) => {
    analyses++;
    return inspect(
      {
        id: videoId,
        title: "Video kiểm thử",
        duration: 40,
        formats: [
          {
            format_id: "22",
            width: 1280,
            height: 720,
            acodec: "aac",
            vcodec: "h264",
            protocol: "https",
          },
        ],
      },
      canonical,
    );
  },
).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH,
    channel: process.env.BROWSER_PATH ? undefined : "chrome",
    headless: true,
  });
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route("https://i.ytimg.com/**", (route) => route.abort());
    await page.goto("http://127.0.0.1:" + server.address().port);
    const input = page.getByLabel("Liên kết YouTube", { exact: true });
    await input.fill("https://example.com/");
    await input.press("Enter");
    await page.getByRole("alert").filter({ hasText: "Hãy nhập link YouTube" }).waitFor();
    assert.equal(await input.inputValue(), "https://example.com/");
    const before = analyses;
    await input.fill(url);
    assert.equal(analyses, before);
    await input.press("Enter");
    await page.getByRole("heading", { name: "Video kiểm thử" }).waitFor();
    assert.ok(await page.getByRole("button", { name: /1080p/ }).isDisabled());
    assert.ok(await page.getByRole("button", { name: /360p/ }).isDisabled());
    await page
      .getByRole("button", { name: "Âm thanh MP3", exact: true })
      .click();
    await page.getByRole("button", { name: /320 kbps/ }).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByRole("button", { name: "Tải MP3 320 kbps" }).click();
    const downloading = page.getByRole("progressbar", { name: "Đang tải dữ liệu" });
    await downloading.waitFor();
    assert.equal(await downloading.getAttribute("aria-valuenow"), "42");
    advanceWorker();
    const converting = page.getByRole("progressbar", { name: "Đang chuyển đổi" });
    await converting.waitFor();
    assert.equal(await converting.getAttribute("aria-valuenow"), "65");
    await page.getByText("Đang chuyển đổi · 65%", { exact: true }).waitFor();
    advanceWorker();
    await page.getByText("Lỗi thử nghiệm chuyển đổi.").waitFor();
    assert.equal(await page.getByRole("progressbar").count(), 0);
    await page.getByRole("button", { name: "Tải video khác" }).click();
    assert.equal(await input.inputValue(), "");
    await page.close();
    console.log("Mock browser flow passed at " + width + "px");
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
