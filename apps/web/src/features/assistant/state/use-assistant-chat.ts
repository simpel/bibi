"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readConversationId } from "../lib/conversation-part";
import { createChatTransport } from "./chat-transport";
import { useConversationSession } from "./use-conversation-session";
import { usePageContext } from "./use-page-context";

export type UseAssistantChatInput = { onConversationChanged: () => void };

/**
 * The assistant's `useChat` plus conversation bookkeeping: remembers the id the server reports
 * (`data-bibi-conversation`), switches conversations by loading stored messages, starts new ones.
 */
export function useAssistantChat({ onConversationChanged }: UseAssistantChatInput) {
  const pageContext = usePageContext();
  const pageRef = useRef(pageContext);
  useEffect(() => {
    pageRef.current = pageContext;
  }, [pageContext]);
  const idRef = useRef<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const adopt = useCallback(({ id }: { id: string | null }) => {
    idRef.current = id;
    setConversationId(id);
  }, []);
  const transport = useMemo(
    () =>
      createChatTransport({
        getConversationId: () => idRef.current,
        getPageContext: () => pageRef.current,
      }),
    [],
  );
  const chat = useChat({
    transport,
    onData: (part) => {
      const id = readConversationId({ part });
      if (id) adopt({ id });
    },
    onFinish: () => onConversationChanged(),
  });
  const { stop, clearError, setMessages } = chat;
  const session = useConversationSession({ adopt, stop, clearError, setMessages });
  return { chat, conversationId, ...session };
}
