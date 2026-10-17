"use client";

import { useCallback, useMemo } from "react";
import type { AssistantContextValue } from "./assistant-context";
import { useAssistantChat } from "./use-assistant-chat";
import { useAssistantView } from "./use-assistant-view";
import { useConversations } from "./use-conversations";
import { useGoHome } from "./use-go-home";
import { useSessionActions } from "./use-session-actions";

/** Builds the context value: the chat view, the chat session and the conversation history. */
export function useAssistantController(): AssistantContextValue {
  const { view, setView } = useAssistantView();
  const goHome = useGoHome();
  const conversations = useConversations();
  const { refresh } = conversations;
  const onConversationChanged = useCallback(() => void refresh(), [refresh]);
  const session = useAssistantChat({ onConversationChanged });
  const actions = useSessionActions({ session, setView, goHome });
  return useMemo(
    () => ({
      view,
      setView: ({ view: next }) => setView(next),
      session,
      conversations,
      goHome,
      ...actions,
    }),
    [view, session, conversations, actions, setView, goHome],
  );
}
