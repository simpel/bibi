"use client";

import { useCallback } from "react";
import type { AssistantContextValue, AssistantView } from "./assistant-context";

export type UseConversationActionsInput = {
  startNew: () => void;
  openConversation: AssistantContextValue["selectConversation"];
  sendMessage: (input: { text: string }) => Promise<void>;
  setView: (view: AssistantView) => void;
  goHome: () => void;
};

/** New conversation, the ⌘K one-shot `ask` and switching to a stored conversation. */
export function useConversationActions({
  startNew,
  openConversation,
  sendMessage,
  setView,
  goHome,
}: UseConversationActionsInput) {
  const newConversation = useCallback(() => {
    startNew();
    setView("chat");
  }, [startNew, setView]);
  const ask = useCallback(
    ({ text }: { text: string }) => {
      startNew();
      setView("chat");
      goHome();
      void sendMessage({ text });
    },
    [startNew, setView, goHome, sendMessage],
  );
  const selectConversation = useCallback(
    async ({ id }: { id: string }) => {
      const errorKey = await openConversation({ id });
      if (!errorKey) setView("chat");
      return errorKey;
    },
    [openConversation, setView],
  );
  return { newConversation, ask, selectConversation };
}
