import path from "node:path";
import { readdir, stat, mkdir, rm } from "node:fs/promises";
import { cfg } from "./config.js";
export const folder = (id: string) => path.join(cfg.temp, "tubego-" + id);
export async function initFiles() {
  await mkdir(cfg.temp, { recursive: true });
  for (const name of await readdir(cfg.temp)) {
    if (/^tubego-[0-9a-f-]{36}$/.test(name))
      await rm(path.join(cfg.temp, name), { recursive: true, force: true });
  }
}
export const erase = (id: string) =>
  rm(folder(id), {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 250,
  });
export async function diskBytes(dir: string) {
  const names = await readdir(dir);
  const sizes = await Promise.all(
    names.map(async (name) => {
      try {
        return (await stat(path.join(dir, name))).size;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return 0;
        throw e;
      }
    }),
  );
  return sizes.reduce((a, b) => a + b, 0);
}
export function filename(title: string, quality: number, type: "mp4" | "mp3") {
  const base =
    Array.from(
      title
        .normalize("NFC")
        .replace(/[<>:"/\\|?*\p{C}]/gu, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
      .slice(0, 60)
      .join("") || "YouTube";
  return base + " - " + quality + (type === "mp4" ? "p" : "kbps") + "." + type;
}
