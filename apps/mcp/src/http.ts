import { AUTH_BASE_PATH, resolveExecuteContext } from "@okazi/auth";
import { getEnv } from "@okazi/config";
import { embed } from "./embed";
import { createHttpServer } from "./http/create-http-server";

const env = getEnv();

const server = createHttpServer({
  resolveContext: resolveExecuteContext,
  embed,
  baseUrl: env.MCP_URL,
  authorizationServer: new URL(AUTH_BASE_PATH, env.BETTER_AUTH_URL).toString(),
  allowedOrigins: [new URL(env.WEB_URL).origin],
});

server.listen(env.PORT, () => {
  console.log(`@okazi/mcp listening on :${env.PORT} (POST /mcp)`);
});
