import type { PageContext } from "@okazi/ai";
import { DefaultChatTransport, type UIMessage } from "ai";

export type ChatTransportInput = {
  getConversationId: () => string | null;
  getPageContext: () => PageContext;
};

/**
 * `POST /api/chat` with the contract of `@okazi/ai`: `{ conversationId?, messages, pageContext }`.
 * Only the newest message is sent (the server rebuilds history from the database, so the browser
 * cannot forge earlier turns). Values are read per request, so one transport serves every
 * conversation and page.
 */
export function createChatTransport({
  getConversationId,
  getPageContext,
}: ChatTransportInput): DefaultChatTransport<UIMessage> {
  return new DefaultChatTransport<UIMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages }) => {
      const conversationId = getConversationId();
      return {
        body: {
          ...(conversationId ? { conversationId } : {}),
          messages: messages.slice(-1),
          pageContext: getPageContext(),
        },
      };
    },
  });
}
