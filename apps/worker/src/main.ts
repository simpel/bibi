import { getEnv } from "@bibi/config";
import { setReservationMailer } from "@bibi/core";
import { createSystemLogSink, getDb } from "@bibi/db";
import { getLogger, initLogger, installProcessHandlers } from "@bibi/logger";
import { sendReservationMail } from "@bibi/mail";
import { createBoss } from "./create-boss";
import { JOBS } from "./jobs";
import { startProviderStreams } from "./provider-streams";
import { provisionAssistant } from "./provision-assistant";
import { registerJobs } from "./register-jobs";

const logSink = createSystemLogSink({ retentionDays: getEnv().SYSTEM_LOG_RETENTION_DAYS });
initLogger({ service: "worker", sinks: [logSink] });
installProcessHandlers({ exitOnUncaught: true });
// Reservation reminders and system cancellations mail guests through this port (ADR 0119).
setReservationMailer({ mailer: sendReservationMail });

async function main(): Promise<void> {
  const boss = createBoss();
  await boss.start();
  await registerJobs({ boss, db: getDb(), jobs: JOBS });
  getLogger().info({ event: "process.started", msg: "@bibi/worker started", jobs: JOBS.length });
  await provisionAssistant({ db: getDb() });
  // Providers that push over a stream (Fortnox Topics) get one connection each (ADR 0090, 0100).
  const streams = await startProviderStreams({ db: getDb() });

  let stopping = false;
  const shutdown = async ({ signal }: { signal: string }): Promise<void> => {
    if (stopping) return;
    stopping = true;
    getLogger().info({ event: "process.stopping", signal });
    for (const stream of streams) stream.stop();
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
