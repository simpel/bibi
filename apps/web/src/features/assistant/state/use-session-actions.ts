"use client";

import { useMemo } from "react";
import type { useAssistantChat } from "./use-assistant-chat";
import { useConversationActions } from "./use-conversation-actions";
import { usePrefill } from "./use-prefill";

export type UseSessionActionsInput = {
  session: ReturnType<typeof useAssistantChat>;
  goHome: () => void;
};

/** New, ask, prefill and select on top of the chat session, as one stable object. */
export function useSessionActions({ session, goHome }: UseSessionActionsInput) {
  const actions = useConversationActions({
    startNew: session.startNew,
    openConversation: session.openConversation,
    sendMessage: async ({ text }) => session.chat.sendMessage({ text }),
    goHome,
  });
  const { draft, prefill } = usePrefill({ newConversation: actions.newConversation, goHome });
  return useMemo(() => ({ ...actions, draft, prefill }), [actions, draft, prefill]);
}
