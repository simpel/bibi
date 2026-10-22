import type { MCPClient } from "@ai-sdk/mcp";
import { resolveExecuteContext } from "@bibi/auth";
import type { LanguageModel } from "ai";
import { createChatHandler } from "../../src/chat/create-chat-handler";
import { createEmbed } from "../../src/embeddings/create-embed";
import { connectMcp } from "../../src/mcp/connect-mcp";

// biome-ignore lint/suspicious/noExplicitAny: loosely typed SSE JSON for assertions
export type Json = any;

export type ChatHarness = {
  handler: (request: Request) => Promise<Response>;
  /** Number of MCP clients opened / closed by the handler. */
  clients: { opened: number; closed: number };
};

export type CreateHarnessInput = { model: LanguageModel; mcpUrl: string };

/** Chat handler wired like the web app (real auth, real MCP over HTTP), with a mock model. */
export function createHarness({ model, mcpUrl }: CreateHarnessInput): ChatHarness {
  const clients = { opened: 0, closed: 0 };
  const connect = async ({
    accessToken,
    caller,
    url,
  }: Parameters<typeof connectMcp>[0]): Promise<MCPClient> => {
    const client = await connectMcp({ accessToken, caller, ...(url ? { url } : {}) });
    clients.opened++;
    const close = client.close.bind(client);
    return Object.assign(client, {
      close: async () => {
        clients.closed++;
        await close();
      },
    });
  };
  const handler = createChatHandler({
    resolveContext: resolveExecuteContext,
    model,
    modelId: "mock-model",
    mcpUrl,
    connect,
    embed: createEmbed(),
    report: ({ stage, error }) => console.error(stage, error),
  });
  return { handler, clients };
}

export type ChatRequestInput = {
  cookies: Headers;
  text: string;
  conversationId?: string;
  /** The page the user asks from; default `/sv/venues`. */
  route?: string;
};

export function chatRequest({
  cookies,
  text,
  conversationId,
  route = "/sv/venues",
}: ChatRequestInput): Request {
  const headers = new Headers(cookies);
  headers.set("content-type", "application/json");
  const message = { id: "client-msg-1", role: "user", parts: [{ type: "text", text }] };
  const body = {
    messages: [message],
    pageContext: { route, locale: "sv" },
    conversationId,
  };
  return new Request("http://localhost:3330/api/assistant/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/** Reads the whole SSE body into UI message chunks. */
export async function readChunks({ response }: { response: Response }): Promise<Json[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.slice("data: ".length)));
}
