import type { Result } from "@okazi/core";
import type { connectMcp } from "../mcp/connect-mcp";
import { errorResponse } from "../server/error-response";
import { resolveUser } from "../server/resolve-user";
import type { ResolvedServerOptions } from "../server/server-options";
import { ensureConversation } from "./ensure-conversation";
import type { RunErrorReporter } from "./finish-run";
import type { ChosenModel } from "./language-model";
import { loadHistory } from "./load-history";
import { parseChatInput } from "./parse-chat-input";
import { runAssistant } from "./run-assistant";

/** Dependencies of the chat endpoint; the model is chosen per request (`chooseModel`). */
export type ChatHandlerRuntime = ResolvedServerOptions & {
  connect: typeof connectMcp;
  report: RunErrorReporter;
  chooseModel: () => Promise<Result<ChosenModel>>;
};

/** Runtime of one assistant run, with the model chosen for it. */
export type ChatRuntime = ChatHandlerRuntime & ChosenModel;

export type HandleChatInput = { request: Request; runtime: ChatHandlerRuntime };

/** One chat turn: auth (user) → model → input → conversation → history → assistant run. */
export async function handleChat({ request, runtime }: HandleChatInput): Promise<Response> {
  const { headers } = request;
  const { embed, resolveContext } = runtime;
  const user = await resolveUser({ headers, resolveContext });
  if (!user.ok) return errorResponse({ error: user.error });
  // Before anything is stored: an unconfigured model fails the turn (503) instead of half of it.
  const chosen = await runtime.chooseModel();
  if (!chosen.ok) return errorResponse({ error: chosen.error });
  const input = await parseChatInput({ request });
  if (!input.ok) return errorResponse({ error: input.error });
  const conversation = await ensureConversation({
    user: user.value,
    embed,
    firstText: input.value.text,
    ...(input.value.conversationId ? { conversationId: input.value.conversationId } : {}),
  });
  if (!conversation.ok) return errorResponse({ error: conversation.error });
  const history = await loadHistory({
    user: user.value,
    embed,
    conversationId: conversation.value.id,
  });
  if (!history.ok) return errorResponse({ error: history.error });
  return runAssistant({
    runtime: { ...runtime, ...chosen.value },
    headers,
    user: user.value,
    input: input.value,
    conversation: conversation.value,
    history: history.value,
  });
}
