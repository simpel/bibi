import { AUTH_BASE_PATH, resolveExecuteContext } from "@okazi/auth";
import { getEnv } from "@okazi/config";
import { createSystemLogSink } from "@okazi/db";
import { getLogger, initLogger, installProcessHandlers } from "@okazi/logger";
import { embed } from "./embed";
import { createHttpServer } from "./http/create-http-server";

const env = getEnv();

initLogger({
  service: "mcp",
  sinks: [createSystemLogSink({ retentionDays: env.SYSTEM_LOG_RETENTION_DAYS })],
});
installProcessHandlers({ exitOnUncaught: true });

const server = createHttpServer({
  resolveContext: resolveExecuteContext,
  embed,
  baseUrl: env.MCP_URL,
  authorizationServer: new URL(AUTH_BASE_PATH, env.BETTER_AUTH_URL).toString(),
  allowedOrigins: [new URL(env.WEB_URL).origin],
});

server.listen(env.PORT, () => {
  getLogger().info({ event: "process.started", msg: "@okazi/mcp listening", port: env.PORT });
});
