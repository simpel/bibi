import { randomUUID } from "node:crypto";
import { elapsedMs, getLogger, runWithLogContext } from "@okazi/logger";

export type RunJobInput = { name: string; run: () => Promise<void> };

/**
 * Runs one job in a system log context with its own `requestId` (ADR 0014, 0027). A failure is
 * logged and rethrown so pg-boss applies the retry policy.
 */
export function runJob({ name, run }: RunJobInput): Promise<void> {
  const requestId = randomUUID();
  return runWithLogContext({
    context: { requestId, surface: "system" },
    fn: async () => {
      const since = performance.now();
      const log = getLogger();
      log.info({ event: "job.started", job: name });
      try {
        await run();
        log.info({ event: "job.completed", job: name, durationMs: elapsedMs({ since }) });
      } catch (error) {
        log.error({ event: "job.failed", job: name, err: error, durationMs: elapsedMs({ since }) });
        throw error;
      }
    },
  });
}
