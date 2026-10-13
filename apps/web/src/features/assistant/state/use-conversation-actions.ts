"use client";

import { useCallback } from "react";
import type { AssistantContextValue, AssistantView } from "./assistant-context";

export type UseConversationActionsInput = {
  startNew: () => void;
  openConversation: AssistantContextValue["selectConversation"];
  sendMessage: (input: { text: string }) => Promise<void>;
  setView: (view: AssistantView) => void;
  setOpen: (open: boolean) => void;
};

/** New conversation, the ⌘K one-shot `ask` and switching to a stored conversation. */
export function useConversationActions({
  startNew,
  openConversation,
  sendMessage,
  setView,
  setOpen,
}: UseConversationActionsInput) {
  const newConversation = useCallback(() => {
    startNew();
    setView("chat");
  }, [startNew, setView]);
  const ask = useCallback(
    ({ text }: { text: string }) => {
      startNew();
      setView("chat");
      setOpen(true);
      void sendMessage({ text });
    },
    [startNew, setView, setOpen, sendMessage],
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
