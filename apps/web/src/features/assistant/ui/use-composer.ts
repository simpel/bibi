"use client";

import type { ChatStatus } from "ai";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

export type UseComposerInput = { status: ChatStatus; onSend: (input: { text: string }) => void };

type EnterInput = { event: KeyboardEvent<HTMLTextAreaElement> };

const isPlainEnter = ({ event }: EnterInput): boolean =>
  event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;

/** Message box state: text, focus on open, send on Enter (Shift+Enter = new line), busy flag. */
export function useComposer({ status, onSend }: UseComposerInput) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => input.current?.focus(), []);

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
