"use client";

import { useCallback, useMemo } from "react";
import type { AssistantContextValue } from "./assistant-context";
import { useAssistantChat } from "./use-assistant-chat";
import { useConversations } from "./use-conversations";
import { useOpenAssistant } from "./use-open-assistant";
import { useSessionActions } from "./use-session-actions";

/** Builds the context value: the chat session and the conversation history. */
export function useAssistantController(): AssistantContextValue {
  const openAssistant = useOpenAssistant();
  const conversations = useConversations();
  const { refresh } = conversations;
  const onConversationChanged = useCallback(() => void refresh(), [refresh]);
  const session = useAssistantChat({ onConversationChanged });
  const actions = useSessionActions({ session, openAssistant });
  return useMemo(
    () => ({
      session,
      conversations,
      openAssistant,
      ...actions,
    }),
    [session, conversations, actions, openAssistant],
  );
}
