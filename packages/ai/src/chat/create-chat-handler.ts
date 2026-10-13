import { getEnv } from "@okazi/config";
import { fromUnknown } from "@okazi/core";
import type { LanguageModel } from "ai";
import { connectMcp } from "../mcp/connect-mcp";
import { errorResponse } from "../server/error-response";
import { type AssistantServerOptions, resolveServerOptions } from "../server/server-options";
import { defaultRunErrorReporter, type RunErrorReporter } from "./finish-run";
import { handleChat } from "./handle-chat";
import { defaultLanguageModel } from "./language-model";

export type CreateChatHandlerInput = AssistantServerOptions & {
  /** Language model; default `AI_DEFAULT_MODEL` via the AI Gateway. Tests: `MockLanguageModelV4`. */
  model?: LanguageModel;
  /** Model id stored in message metadata; default `AI_DEFAULT_MODEL`. */
  modelId?: string;
  /** Test seam: wraps the MCP client factory (e.g. to observe `close()`). */
  connect?: typeof connectMcp;
  /** Where background failures (persist/close after the stream ended) are reported. */
  report?: RunErrorReporter;
};

/**
 * Chat endpoint as a Web `(request: Request) => Promise<Response>`, mountable in a Next route
 * (`export const POST = createChatHandler({ resolveContext: resolveExecuteContext })`).
 * Response: AI SDK UI message stream (SSE) + `x-okazi-conversation-id` header; errors are JSON
 * `{ error: { code, message } }` with the shared AppError → HTTP status map.
 */
export function createChatHandler({
  model,
  modelId,
  connect,
  report,
  resolveContext,
  getAccessToken,
  mcpUrl,
  embed,
}: CreateChatHandlerInput) {
  const runtime = {
    ...resolveServerOptions({ resolveContext, getAccessToken, mcpUrl, embed }),
    model: model ?? defaultLanguageModel({ ...(modelId ? { modelId } : {}) }),
    modelId: modelId ?? getEnv().AI_DEFAULT_MODEL,
    connect: connect ?? connectMcp,
    report: report ?? defaultRunErrorReporter,
  };
  return async (request: Request): Promise<Response> => {
    try {
      return await handleChat({ request, runtime });
    } catch (error) {
      return errorResponse({ error: fromUnknown({ error }) });
    }
  };
}
