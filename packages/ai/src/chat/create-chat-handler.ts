import { fromUnknown, ok } from "@bibi/core";
import { getLogger, withRequestLogging } from "@bibi/logger";
import type { LanguageModel } from "ai";
import { connectMcp } from "../mcp/connect-mcp";
import { errorResponse } from "../server/error-response";
import { type AssistantServerOptions, resolveServerOptions } from "../server/server-options";
import { defaultRunErrorReporter, type RunErrorReporter } from "./finish-run";
import { handleChat } from "./handle-chat";
import { configuredLanguageModel } from "./language-model";

export type CreateChatHandlerInput = AssistantServerOptions & {
  /**
   * Test/E2E seam only (`MockLanguageModelV4`). Without it the model is the one a superadmin
   * chose for `assistant.chat` (ADR 0015); unconfigured → 503 UNAVAILABLE.
   */
  model?: LanguageModel;
  /** Model id stored in message metadata with an explicit `model`; default its `modelId`. */
  modelId?: string;
  /** Test seam: wraps the MCP client factory (e.g. to observe `close()`). */
  connect?: typeof connectMcp;
  /** Where background failures (persist/close after the stream ended) are reported. */
  report?: RunErrorReporter;
};

type FixedModelInput = { model: LanguageModel; modelId: string | undefined };

const fixedModel = ({ model, modelId }: FixedModelInput) => {
  const id = modelId ?? (typeof model === "string" ? model : model.modelId);
  return async () => ok({ value: { model, modelId: id } });
};

/**
 * Chat endpoint as a Web `(request: Request) => Promise<Response>`, mountable in a Next route
 * (`export const POST = createChatHandler({ resolveContext: resolveExecuteContext })`).
 * Response: AI SDK UI message stream (SSE) + `x-bibi-conversation-id` header; errors are JSON
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
    connect: connect ?? connectMcp,
    report: report ?? defaultRunErrorReporter,
    chooseModel: model ? fixedModel({ model, modelId }) : configuredLanguageModel,
  };
  return withRequestLogging({
    surface: "ai",
    handler: async (request) => {
      try {
        return await handleChat({ request, runtime });
      } catch (error) {
        getLogger().error({ event: "ai.chatFailed", err: error });
        return errorResponse({ error: fromUnknown({ error }) });
      }
    },
  });
}
