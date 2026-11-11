import { createServer, type Server } from "node:http";
import { type CreateMcpHandlerInput, createMcpHandler } from "../src/http/create-mcp-handler";
import { sendWebResponse, toWebRequest } from "./node-adapter";

/**
 * Tests only: `createMcpHandler` on a `node:http` server, so the SDK client talks real HTTP. In the
 * app the web route mounts the same handler (ADR 0104).
 */
export function createHttpServer({ baseUrl, ...rest }: CreateMcpHandlerInput): Server {
  const handle = createMcpHandler({ baseUrl, ...rest });
  return createServer(async (req, res) => {
    const response = await handle(toWebRequest({ req, baseUrl }));
    await sendWebResponse({ res, response });
  });
}
