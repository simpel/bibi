import { getEnv } from "@okazi/config";
import { createSystemLogSink } from "@okazi/db";
import { getLogger, initLogger, installProcessHandlers } from "@okazi/logger";
import { ensureOperations } from "@/server/operations";

/** Registers core operations on server startup (Node runtime only). */
export function registerCoreOperations(): void {
  ensureOperations();
}

/** Process logger for the web server; Next owns the process, so no exit on uncaught errors. */
export function registerLogging(): void {
  const retentionDays = getEnv().SYSTEM_LOG_RETENTION_DAYS;
  // stdout for ops + the SystemLog table for the platform admin view (ADR 0014, 0015).
  initLogger({ service: "web", sinks: [createSystemLogSink({ retentionDays })] });
  installProcessHandlers({ exitOnUncaught: false });
  getLogger().info({ event: "process.started", msg: "@okazi/web started" });
}

export type LogRequestErrorInput = {
  error: unknown;
  path: string;
  method: string;
  context: { routePath: string; routeType: string; renderSource?: string | undefined };
};

export function logRequestError({ error, path, method, context }: LogRequestErrorInput): void {
  getLogger().error({
    event: "http.unhandledError",
    // Path only: query strings may carry tokens.
    path: path.split("?")[0],
    method,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    err: error,
  });
}
