"use client";

import type { ChatStatus } from "ai";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { ComponentProps, FormEvent, HTMLAttributes, KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type PromptInputMessage = { text: string };

export type PromptInputProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void;
};

/** AI Elements `PromptInput`: bordered message box; submits `{ text }` read from the textarea. */
export function PromptInput({ className, onSubmit, ...props }: PromptInputProps) {
  return (
    <form
      data-slot="prompt-input"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs",
        "focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem("message");
        const text = field instanceof HTMLTextAreaElement ? field.value.trim() : "";
        if (text) onSubmit({ text }, event);
      }}
      {...props}
    />
  );
}

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export function PromptInputBody({ className, ...props }: PromptInputBodyProps) {
  return <div data-slot="prompt-input-body" className={cn("contents", className)} {...props} />;
}

export type PromptInputTextareaProps = ComponentProps<"textarea">;

const isPlainEnter = ({ event }: { event: KeyboardEvent<HTMLTextAreaElement> }): boolean =>
  event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;

/** Enter submits, Shift+Enter adds a line. Grows with its content up to a cap. */
export function PromptInputTextarea({ className, onKeyDown, ...props }: PromptInputTextareaProps) {
  return (
    <textarea
      data-slot="prompt-input-textarea"
      name="message"
      rows={1}
      className={cn(
        "field-sizing-content max-h-48 min-h-14 w-full resize-none bg-transparent px-4 py-3 text-sm",
        "outline-none placeholder:text-muted-foreground",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !isPlainEnter({ event })) return;
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }}
      {...props}
    />
  );
}

export type PromptInputFooterProps = HTMLAttributes<HTMLDivElement>;

export function PromptInputFooter({ className, ...props }: PromptInputFooterProps) {
  return (
    <div
      data-slot="prompt-input-footer"
      className={cn("flex items-center justify-between gap-2 px-2 pb-2", className)}
      {...props}
    />
  );
}

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export function PromptInputTools({ className, ...props }: PromptInputToolsProps) {
  return (
    <div
      data-slot="prompt-input-tools"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

export type PromptInputSubmitProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  status?: ChatStatus;
  onStop?: () => void;
};

/** Send button; while the model works it becomes a stop button. */
export function PromptInputSubmit({ status, onStop, className, ...props }: PromptInputSubmitProps) {
  const busy = status === "submitted" || status === "streaming";
  return (
    <Button
      data-slot="prompt-input-submit"
      type={busy ? "button" : "submit"}
      size="icon"
      className={cn("rounded-full", className)}
      onClick={busy ? onStop : undefined}
      {...props}
    >
      {busy ? <SquareIcon /> : <ArrowUpIcon />}
    </Button>
  );
}

export type PromptInputButtonProps = ComponentProps<typeof Button>;

/** Small ghost icon button for the footer toolbar (skills, attachments, …). */
export function PromptInputButton({ className, ...props }: PromptInputButtonProps) {
  return (
    <Button
      data-slot="prompt-input-button"
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8 rounded-full text-muted-foreground", className)}
      {...props}
    />
  );
}
