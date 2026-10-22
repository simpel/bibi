import { resolveExecuteContext } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { createSystemLogSink } from "@bibi/db";
import { getLogger, initLogger, installProcessHandlers } from "@bibi/logger";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { embed } from "./embed";
import { createMcpServer } from "./server/create-mcp-server";

// stdout carries the protocol; log to stderr only.
initLogger({
  service: "mcp-stdio",
  stream: "stderr",
  sinks: [createSystemLogSink({ retentionDays: getEnv().SYSTEM_LOG_RETENTION_DAYS })],
});
installProcessHandlers({ exitOnUncaught: true });

async function main(): Promise<void> {
  const apiKey = getEnv().BIBI_API_KEY;
  if (!apiKey) throw new Error("BIBI_API_KEY is required for the stdio server");
  const resolved = await resolveExecuteContext({ headers: new Headers({ "x-api-key": apiKey }) });
  if (!resolved.ok) throw new Error(`Authentication failed: ${resolved.error.message}`);
  const server = createMcpServer({ context: resolved.value, embed });
  await server.connect(new StdioServerTransport());
  getLogger().info({ event: "process.started", msg: "@bibi/mcp stdio connected" });
}

main().catch((error: unknown) => {
  getLogger().fatal({ event: "process.startFailed", err: error });
  process.exit(1);
});
