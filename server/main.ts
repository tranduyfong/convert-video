import { cfg } from "./config.js";
import { initFiles } from "./files.js";
import { Queue } from "./queue.js";
import { createApp } from "./app.js";
await initFiles();
const queue = new Queue();
setInterval(() => void queue.clean(), Math.min(30000, cfg.ttl)).unref();
createApp(queue).listen(cfg.port, process.env.HOST || "127.0.0.1", () =>
  console.log("TubeGo listening on port " + cfg.port),
);
