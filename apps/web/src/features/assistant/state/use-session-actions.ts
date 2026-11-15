"use client";

import { useMemo } from "react";
import type { useAssistantChat } from "./use-assistant-chat";
import { useConversationActions } from "./use-conversation-actions";
import { usePrefill } from "./use-prefill";

export type UseSessionActionsInput = {
  session: ReturnType<typeof useAssistantChat>;
  openAssistant: () => void;
};

/** New, ask, prefill and select on top of the chat session, as one stable object. */
export function useSessionActions({ session, openAssistant }: UseSessionActionsInput) {
  const actions = useConversationActions({
    startNew: session.startNew,
    openConversation: session.openConversation,
    sendMessage: async ({ text }) => session.chat.sendMessage({ text }),
    openAssistant,
  });
  const { draft, prefill } = usePrefill({
    newConversation: actions.newConversation,
    openAssistant,
  });
  return useMemo(() => ({ ...actions, draft, prefill }), [actions, draft, prefill]);
}
