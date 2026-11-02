import { getEnv } from "@bibi/config";
import { createSystemLogSink, getDb } from "@bibi/db";
import { getLogger, initLogger, installProcessHandlers } from "@bibi/logger";
import { createBoss } from "./create-boss";
import { catchUpFortnox } from "./fortnox/catch-up";
import { startFortnoxStream } from "./fortnox/topics-stream";
import { JOBS } from "./jobs";
import { registerJobs } from "./register-jobs";

const logSink = createSystemLogSink({ retentionDays: getEnv().SYSTEM_LOG_RETENTION_DAYS });
initLogger({ service: "worker", sinks: [logSink] });
installProcessHandlers({ exitOnUncaught: true });

async function main(): Promise<void> {
  const boss = createBoss();
  await boss.start();
  await registerJobs({ boss, db: getDb(), jobs: JOBS });
  getLogger().info({ event: "process.started", msg: "@bibi/worker started", jobs: JOBS.length });
  // Fortnox pushes invoice payments over one stream for every organization (ADR 0090).
  await catchUpFortnox({ db: getDb() });
  const fortnox = startFortnoxStream();

  let stopping = false;
  const shutdown = async ({ signal }: { signal: string }): Promise<void> => {
    if (stopping) return;
    stopping = true;
    getLogger().info({ event: "process.stopping", signal });
    fortnox.stop();
    await boss.stop({ graceful: true, timeout: 20_000 });
    await logSink.flush();
    process.exit(0);
  };
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => void shutdown({ signal }));
}

main().catch((error: unknown) => {
  getLogger().fatal({ event: "process.startFailed", err: error });
  process.exit(1);
});
