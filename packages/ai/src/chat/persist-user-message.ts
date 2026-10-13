import { appendMessage, type EmbedFn, type MessageDto, type Result } from "@okazi/core";
import type { PageContext } from "../prompt/page-context-schema";
import { runCore } from "../server/run-core";
import type { UserContext } from "../server/resolve-user";

export type PersistUserMessageInput = {
  user: UserContext;
  embed: EmbedFn;
  conversationId: string;
  text: string;
  clientMessageId: string;
  page?: PageContext;
};

/** USER turn, appended by the app *as the user* through core (AI may only append ASSISTANT/TOOL). */
export function persistUserMessage({
  user,
  embed,
  conversationId,
  text,
  clientMessageId,
  page,
}: PersistUserMessageInput): Promise<Result<MessageDto>> {
  const metadata = { clientMessageId, ...(page ? { pageContext: page } : {}) };
  return runCore({
    operation: appendMessage,
    input: { conversationId, role: "USER", parts: [{ type: "text", text }], metadata },
    context: user,
    embed,
  });
}
