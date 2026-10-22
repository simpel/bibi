import { AUTH_BASE_PATH, resolveExecuteContext } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { setFileStore } from "@bibi/core";
import { createSystemLogSink } from "@bibi/db";
import { getLogger, initLogger, installProcessHandlers } from "@bibi/logger";
import { getStorage } from "@bibi/storage";
import { embed } from "./embed";
import { createHttpServer } from "./http/create-http-server";

const env = getEnv();

initLogger({
  service: "mcp",
  sinks: [createSystemLogSink({ retentionDays: env.SYSTEM_LOG_RETENTION_DAYS })],
});
installProcessHandlers({ exitOnUncaught: true });
// Core reaches file storage through this port (ADR 0063): `file.upload`, `file.get`.
setFileStore({ store: getStorage() });

const server = createHttpServer({
  resolveContext: resolveExecuteContext,
  embed,
  baseUrl: env.MCP_URL,
  authorizationServer: new URL(AUTH_BASE_PATH, env.BETTER_AUTH_URL).toString(),
  allowedOrigins: [new URL(env.WEB_URL).origin],
});

server.listen(env.PORT, () => {
  getLogger().info({ event: "process.started", msg: "@bibi/mcp listening", port: env.PORT });
});
