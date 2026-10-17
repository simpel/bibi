"use client";

import { useMemo } from "react";
import type { AssistantView } from "./assistant-context";
import type { useAssistantChat } from "./use-assistant-chat";
import { useConversationActions } from "./use-conversation-actions";
import { usePrefill } from "./use-prefill";

export type UseSessionActionsInput = {
  session: ReturnType<typeof useAssistantChat>;
  setView: (view: AssistantView) => void;
  setOpen: (open: boolean) => void;
};

/** New, ask, prefill and select on top of the chat session, as one stable object. */
export function useSessionActions({ session, setView, setOpen }: UseSessionActionsInput) {
  const actions = useConversationActions({
    startNew: session.startNew,
    openConversation: session.openConversation,
    sendMessage: async ({ text }) => session.chat.sendMessage({ text }),
    setView,
    setOpen,
  });
  const { draft, prefill } = usePrefill({ newConversation: actions.newConversation, setOpen });
  return useMemo(() => ({ ...actions, draft, prefill }), [actions, draft, prefill]);
}
