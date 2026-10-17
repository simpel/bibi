"use client";

import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes } from "react";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "../../lib/cn";

export type MessageProps = HTMLAttributes<HTMLDivElement> & { from: UIMessage["role"] };

/** AI Elements `Message`: one turn; the user's turn is right-aligned. */
export function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-role={from}
      className={cn(
        "group flex w-full max-w-[95%] flex-col gap-2",
        from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
        className,
      )}
      {...props}
    />
  );
}

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export function MessageContent({ className, ...props }: MessageContentProps) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex w-fit min-w-0 max-w-full flex-col gap-3 text-sm",
        "group-[.is-user]:ml-auto group-[.is-user]:whitespace-pre-wrap group-[.is-user]:rounded-lg",
        "group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3",
        "group-[.is-assistant]:w-full",
        className,
      )}
      {...props}
    />
  );
}

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

/** Streaming markdown (Streamdown): safe against half-written syntax while tokens arrive. */
export const MessageResponse = memo(
  function MessageResponse({ className, ...props }: MessageResponseProps) {
    return (
      <Streamdown
        className={cn(
          "size-full break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className,
        )}
        {...props}
      />
    );
  },
  (prev, next) => prev.children === next.children,
);
