import { Problem } from "./config.js";
export function normalize(value: unknown) {
  const invalid = () =>
    new Problem(400, "Hãy nhập link YouTube của một video hoặc Shorts.");
  if (typeof value !== "string" || value.length > 2048) throw invalid();
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    throw invalid();
  }
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.port ||
    u.username ||
    u.password
  )
    throw invalid();
  let id: string | null = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  if (
    ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
  ) {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.slice(8);
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw invalid();
  return "https://www.youtube.com/watch?v=" + id;
}
