"use client";

import type { UIMessage } from "ai";
import { useCallback, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { loadConversationAction } from "../actions";
import type { StoredDecision } from "../lib/stored-messages";

export type UseConversationSessionInput = {
  /** Remembers the conversation id (state + the transport's ref). */
  adopt: (input: { id: string | null }) => void;
  /** `useChat` functions the session drives (stable). */
  stop: () => void;
  clearError: () => void;
  setMessages: (messages: UIMessage[]) => void;
};

/** Switching and starting conversations, with the approval decisions of a loaded one. */
export function useConversationSession({
  adopt,
  stop,
  clearError,
  setMessages,
}: UseConversationSessionInput) {
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [loading, setLoading] = useState(false);

  const startNew = useCallback(() => {
    stop();
    adopt({ id: null });
    setDecisions([]);
    setMessages([]);
    clearError();
  }, [stop, adopt, setMessages, clearError]);

  const openConversation = useCallback(
    async ({ id }: { id: string }): Promise<ErrorKey | null> => {
      stop();
      setLoading(true);
      const result = await loadConversationAction({ id });
      setLoading(false);
      if (!result.ok) return errorKeyForCode({ code: result.error.code });
      adopt({ id });
      setDecisions(result.value.decisions);
      setMessages(result.value.messages);
      clearError();
      return null;
    },
    [stop, adopt, setMessages, clearError],
  );

  return { decisions, loading, startNew, openConversation };
}
