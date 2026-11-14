"use client";

import { useCallback } from "react";
import type { AssistantContextValue } from "./assistant-context";

export type UseConversationActionsInput = {
  startNew: () => void;
  openConversation: AssistantContextValue["selectConversation"];
  sendMessage: (input: { text: string }) => Promise<void>;
  openAssistant: () => void;
};

/** New conversation, the ⌘K one-shot `ask` and opening a stored conversation on the assistant page. */
export function useConversationActions({
  startNew,
  openConversation,
  sendMessage,
  openAssistant,
}: UseConversationActionsInput) {
  const newConversation = useCallback(() => {
    startNew();
  }, [startNew]);
  const ask = useCallback(
    ({ text }: { text: string }) => {
      startNew();
      openAssistant();
      void sendMessage({ text });
    },
    [startNew, openAssistant, sendMessage],
  );
  const selectConversation = useCallback(
    async ({ id }: { id: string }) => {
      const errorKey = await openConversation({ id });
      if (!errorKey) openAssistant();
      return errorKey;
    },
    [openConversation, openAssistant],
  );
  return { newConversation, ask, selectConversation };
}
