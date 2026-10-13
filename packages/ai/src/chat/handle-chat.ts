import type { LanguageModel } from "ai";
import type { connectMcp } from "../mcp/connect-mcp";
import { errorResponse } from "../server/error-response";
import { resolveUser } from "../server/resolve-user";
import type { ResolvedServerOptions } from "../server/server-options";
import { ensureConversation } from "./ensure-conversation";
import type { RunErrorReporter } from "./finish-run";
import { loadHistory } from "./load-history";
import { parseChatInput } from "./parse-chat-input";
import { runAssistant } from "./run-assistant";

export type ChatRuntime = ResolvedServerOptions & {
  model: LanguageModel;
  modelId: string;
  connect: typeof connectMcp;
  report: RunErrorReporter;
};

export type HandleChatInput = { request: Request; runtime: ChatRuntime };

/** One chat turn: auth (user) → input → conversation → history → assistant run (stream). */
export async function handleChat({ request, runtime }: HandleChatInput): Promise<Response> {
  const { headers } = request;
  const { embed, resolveContext } = runtime;
  const user = await resolveUser({ headers, resolveContext });
  if (!user.ok) return errorResponse({ error: user.error });
  const input = await parseChatInput({ request });
  if (!input.ok) return errorResponse({ error: input.error });
  const conversation = await ensureConversation({
    user: user.value,
    embed,
    firstText: input.value.text,
    ...(input.value.conversationId ? { conversationId: input.value.conversationId } : {}),
  });
  if (!conversation.ok) return errorResponse({ error: conversation.error });
  const history = await loadHistory({ user: user.value, embed, conversationId: conversation.value.id });
  if (!history.ok) return errorResponse({ error: history.error });
  return runAssistant({
    runtime,
    headers,
    user: user.value,
    input: input.value,
    conversation: conversation.value,
    history: history.value,
  });
}
