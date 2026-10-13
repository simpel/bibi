"use client";

import { cn } from "@okazi/ui";
import type { UIMessage } from "ai";
import { isTextUIPart } from "ai";
import { MessageContent } from "./message-parts";

export type MessageItemProps = { message: UIMessage };

/** One chat message: the user's text in a bubble, the assistant's parts as flowing content. */
export function MessageItem({ message }: MessageItemProps) {
  if (message.role === "user") {
    const text = message.parts
      .filter(isTextUIPart)
      .map((part) => part.text)
      .join("\n");
    return (
      <div className="flex justify-end" data-role="user">
        <p
          className={cn(
            "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm",
            "bg-primary px-3 py-2 text-sm text-primary-foreground",
          )}
        >
          {text}
        </p>
      </div>
    );
  }
  return (
    <div className="grid min-w-0 gap-2" data-role="assistant">
      <MessageContent message={message} />
    </div>
  );
}
