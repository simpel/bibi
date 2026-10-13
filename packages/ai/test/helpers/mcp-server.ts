import type { AddressInfo } from "node:net";
import { resolveExecuteContext } from "@okazi/auth";
// The real apps/mcp HTTP host, imported by path: a package dependency would make a cycle
// (apps/mcp depends on @okazi/ai for its embedder).
import { createHttpServer } from "../../../../apps/mcp/src/http/create-http-server";
import { createEmbed } from "../../src/embeddings/create-embed";

export type RunningMcp = { url: string; close: () => Promise<void> };

/** apps/mcp over Streamable HTTP on a random port, with the real auth resolver. */
export async function startMcpServer(): Promise<RunningMcp> {
  const server = createHttpServer({
    resolveContext: resolveExecuteContext,
    embed: createEmbed(),
    baseUrl: "http://localhost:3001",
    authorizationServer: "http://localhost:3000/api/auth",
    allowedOrigins: [],
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
