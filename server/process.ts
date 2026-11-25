import { spawn } from "node:child_process";
import { Problem } from "./config.js";
export async function run(
  program: string,
  args: string[],
  signal: AbortSignal,
  line?: (s: string) => void,
): Promise<string> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "",
      errors = "",
      tail = "";
    const stop = () => child.kill("SIGKILL");
    signal.addEventListener("abort", stop, { once: true });
    child.stdout.setEncoding("utf8").on("data", (s: string) => {
      if (line) {
        const parts = (tail + s).split(/\r?\n/);
        tail = (parts.pop() || "").slice(-8192);
        parts.forEach(line);
      } else {
        output += s;
        if (output.length > 16 * 1024 * 1024) stop();
      }
    });
    child.stderr.setEncoding("utf8").on("data", (s: string) => {
      errors = (errors + s).slice(-16384);
    });
    child.once("error", () =>
      reject(new Problem(503, "Máy chủ chưa sẵn sàng xử lý media.")),
    );
    child.once("close", (code) => {
      signal.removeEventListener("abort", stop);
      if (signal.aborted) return reject(signal.reason);
      if (code === 0) return resolve(output);
      if (/confirm.*bot|sign in to confirm|verify.*(?:human|bot)/i.test(errors)) {
        console.error("Media source rejected request: verification_required");
        return reject(
          new Problem(
            503,
            "YouTube yêu cầu xác minh máy chủ. Hiện chưa thể xử lý video này. Vui lòng thử lại sau.",
          ),
        );
      }
      if (
        /403|429|confirm.*bot|sign in|verify|login required|forbidden/i.test(
          errors,
        )
      )
        return reject(
          new Problem(422, "YouTube từ chối truy cập hoặc yêu cầu xác minh."),
        );
      if (
        /private|unavailable|removed|not available|members.only/i.test(errors)
      )
        return reject(
          new Problem(422, "Video đã bị gỡ hoặc không thể truy cập công khai."),
        );
      reject(
        new Problem(
          502,
          "Không thể tải hoặc xử lý dữ liệu. Vui lòng thử lại sau.",
        ),
      );
    });
  });
}
