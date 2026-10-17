"use client";

import type { ChatStatus } from "ai";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { ComposerDraft } from "../state/use-prefill";

export type UseComposerInput = {
  status: ChatStatus;
  onSend: (input: { text: string }) => void;
  /** Prefilled text; replaces the box's text whenever a new draft arrives. */
  draft?: ComposerDraft | null | undefined;
};

type EnterInput = { event: KeyboardEvent<HTMLTextAreaElement> };

const isPlainEnter = ({ event }: EnterInput): boolean =>
  event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;

/** Message box state: text, focus on open, send on Enter (Shift+Enter = new line), busy flag. */
export function useComposer({ status, onSend, draft }: UseComposerInput) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (!draft) return;
    setText(draft.text);
    input.current?.focus();
  }, [draft]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    onSend({ text: value });
    setText("");
  };
  const onKeyDown = ({ event }: EnterInput) => {
    if (!isPlainEnter({ event })) return;
    event.preventDefault();
    submit();
  };
  return { text, setText, input, busy, submit, onKeyDown };
}
