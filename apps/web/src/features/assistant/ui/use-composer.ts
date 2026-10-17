"use client";

import { useEffect, useRef } from "react";
import type { ComposerDraft } from "../state/use-prefill";

/** Focuses the message box on open, fills it when a prefilled draft arrives and appends picked text. */
export function useComposer({ draft }: { draft?: ComposerDraft | null | undefined }) {
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (!draft || !input.current) return;
    input.current.value = draft.text;
    input.current.focus();
  }, [draft]);
  const insert = ({ text }: { text: string }) => {
    const field = input.current;
    if (!field) return;
    field.value = field.value ? `${field.value.trimEnd()} ${text}` : text;
    field.focus();
  };
  return { input, insert };
}
