import "dotenv/config";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
test("exported homepage and sitemap", async () => {
  const html = await readFile("frontend/out/index.html", "utf8");
  const origin = new URL(process.env.SITE_URL || "https://downloadvideo.id.vn")
    .origin;
  for (const part of [
    'lang="vi"',
    "<title>Tải video YouTube MP4",
    'name="description"',
    'rel="canonical" href="' + origin + '/"',
    "application/ld+json",
    "Cách tải video YouTube trong 3 bước",
    'property="og:image"',
    'name="twitter:card"',
  ])
    assert.ok(html.includes(part), part);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  const xml = await readFile("frontend/out/sitemap.xml", "utf8");
  assert.ok(xml.includes("<loc>" + origin + "/</loc>"));
  assert.equal((xml.match(/<loc>/g) || []).length, 1);
});
