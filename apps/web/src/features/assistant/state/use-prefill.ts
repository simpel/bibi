"use client";

import { useCallback, useState } from "react";

/** Text put into the composer for the user to edit and send; `id` changes on every prefill. */
export type ComposerDraft = { id: number; text: string };

export type UsePrefillInput = { newConversation: () => void; goHome: () => void };

/** Opens a fresh conversation with `text` in the message box, unsent (e.g. the calendar's empty slot). */
export function usePrefill({ newConversation, goHome }: UsePrefillInput) {
  const [draft, setDraft] = useState<ComposerDraft | null>(null);
  const prefill = useCallback(
    ({ text }: { text: string }) => {
      newConversation();
      goHome();
      setDraft((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
    },
    [newConversation, goHome],
  );
  return { draft, prefill };
}
