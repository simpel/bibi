"use client";

import { useCallback } from "react";
import type { AssistantContextValue } from "./assistant-context";

export type UseConversationActionsInput = {
  startNew: () => void;
  openConversation: AssistantContextValue["selectConversation"];
  sendMessage: (input: { text: string }) => Promise<void>;
  goHome: () => void;
};

/** New conversation, the ⌘K one-shot `ask` and opening a stored conversation on the start page. */
export function useConversationActions({
  startNew,
  openConversation,
  sendMessage,
  goHome,
}: UseConversationActionsInput) {
  const newConversation = useCallback(() => {
    startNew();
  }, [startNew]);
  const ask = useCallback(
    ({ text }: { text: string }) => {
      startNew();
      goHome();
      void sendMessage({ text });
    },
    [startNew, goHome, sendMessage],
  );
  const selectConversation = useCallback(
    async ({ id }: { id: string }) => {
      const errorKey = await openConversation({ id });
      if (!errorKey) goHome();
      return errorKey;
    },
    [openConversation, goHome],
  );
  return { newConversation, ask, selectConversation };
}
