import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { cfg, Problem, busy } from "./config.js";
import { erase } from "./files.js";
import { convert, type Task } from "./convert.js";
type FileInfo = Awaited<ReturnType<typeof convert>>;
type Job = {
  id: string;
  token: string;
  stage: "queued" | "downloading" | "converting" | "ready" | "failed";
  percent?: number;
  error?: string;
  file?: FileInfo;
  expires?: number;
  readers: number;
};
export class Queue {
  private jobs = new Map<string, Job>();
  private pending: { job: Job; task: Task }[] = [];
  private active = 0;
  constructor(
    private worker = convert,
    private remove = erase,
  ) {}
  add(task: Task) {
    if (this.active >= cfg.concurrent && this.pending.length >= cfg.waiting)
      throw busy();
    const job: Job = {
      id: randomUUID(),
      token: randomBytes(32).toString("hex"),
      stage: "queued",
      readers: 0,
    };
    this.jobs.set(job.id, job);
    this.pending.push({ job, task });
    this.pump();
    return job;
  }
  private pump() {
    while (this.active < cfg.concurrent && this.pending.length) {
      const { job, task } = this.pending.shift()!;
      this.active++;
      void this.execute(job, task);
    }
  }
  private async execute(job: Job, task: Task) {
    try {
      job.file = await this.worker(job.id, task, (stage, percent) =>
        Object.assign(job, { stage, percent }),
      );
      job.stage = "ready";
    } catch (e) {
      job.stage = "failed";
      job.error =
        e instanceof Problem
          ? e.message
          : "Xử lý file thất bại. Vui lòng thử lại.";
      await this.remove(job.id).catch(() => {});
    } finally {
      job.percent = job.stage === "ready" ? 100 : undefined;
      job.expires = Date.now() + cfg.ttl;
      this.active--;
      this.pump();
    }
  }
  get(id: string, token: string) {
    const job = this.jobs.get(id);
    if (
      !job ||
      !/^[a-f0-9]{64}$/.test(token) ||
      !timingSafeEqual(Buffer.from(job.token), Buffer.from(token))
    )
      throw new Problem(
        404,
        "Không tìm thấy tác vụ hoặc phiên truy cập đã hết hạn.",
      );
    if (job.expires && job.expires <= Date.now())
      throw new Problem(410, "File đã hết hạn. Hãy phân tích lại video.");
    return job;
  }
  async clean() {
    for (const [id, j] of this.jobs)
      if (j.expires && j.expires <= Date.now() && !j.readers) {
        try {
          await this.remove(id);
          this.jobs.delete(id);
        } catch {
          /* Retry at the next sweep. */
        }
      }
  }
}
