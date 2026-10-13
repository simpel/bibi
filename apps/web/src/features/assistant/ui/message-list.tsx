"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";
import { ThinkingIndicator } from "./thinking-indicator";

export type MessageListProps = { messages: UIMessage[]; status: ChatStatus };

const waitingForOutput = ({ messages, status }: MessageListProps): boolean => {
  if (status === "submitted") return true;
  const last = messages[messages.length - 1];
  return status === "streaming" && last?.role === "assistant" && last.parts.length === 0;
};

/** Scrolling transcript; follows new output to the bottom. */
export function MessageList({ messages, status }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever the transcript changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-3"
      data-slot="assistant-messages"
      aria-live="polite"
    >
      <div className="grid gap-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {waitingForOutput({ messages, status }) ? <ThinkingIndicator /> : null}
      </div>
      <div ref={endRef} />
    </div>
  );
}
