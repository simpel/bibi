import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveExecuteContext } from "@okazi/auth";
import { getEnv } from "@okazi/config";
import { embed } from "./embed";
import { createMcpServer } from "./server/create-mcp-server";

// stdout carries the protocol; log to stderr only.
async function main(): Promise<void> {
  const apiKey = getEnv().OKAZI_API_KEY;
  if (!apiKey) throw new Error("OKAZI_API_KEY is required for the stdio server");
  const resolved = await resolveExecuteContext({ headers: new Headers({ "x-api-key": apiKey }) });
  if (!resolved.ok) throw new Error(`Authentication failed: ${resolved.error.message}`);
  const server = createMcpServer({ context: resolved.value, embed });
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
