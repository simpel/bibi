import { isDevEnvironment } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { createSystemLogSink } from "@bibi/db";
import { getLogger, initLogger, installProcessHandlers } from "@bibi/logger";
import { formatDevBanner } from "@/lib/dev-banner";
import { devServices } from "@/lib/dev-services";
import { ensureOperations } from "@/server/operations";

/** Registers core operations on server startup (Node runtime only). */
export function registerCoreOperations(): void {
  ensureOperations();
}

/** Process logger for the web server; Next owns the process, so no exit on uncaught errors. */
export function registerLogging(): void {
  const retentionDays = getEnv().SYSTEM_LOG_RETENTION_DAYS;
  // stdout for ops + the SystemLog table for the superadmin view (ADR 0014, 0015).
  initLogger({ service: "web", sinks: [createSystemLogSink({ retentionDays })] });
  installProcessHandlers({ exitOnUncaught: false });
  getLogger().info({ event: "process.started", msg: "@bibi/web started" });
}

/** `pnpm dev` only: prints the local services to the console. */
export function registerDevBanner(): void {
  if (!isDevEnvironment()) return;
  const { WEB_URL, MCP_URL, STORYBOOK_URL } = getEnv();
  const services = devServices({ webUrl: WEB_URL, mcpUrl: MCP_URL, storybookUrl: STORYBOOK_URL });
  process.stdout.write(formatDevBanner({ services }));
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
