"use client";

import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

/** AI Elements `Conversation`: scroll container that follows streaming output. */
export function Conversation({ className, ...props }: ConversationProps) {
  return (
    <StickToBottom
      data-slot="conversation"
      className={cn("relative flex-1 overflow-y-hidden", className)}
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    />
  );
}

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export function ConversationContent({ className, ...props }: ConversationContentProps) {
  return (
    <StickToBottom.Content
      data-slot="conversation-content"
      className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6 p-4", className)}
      {...props}
    />
  );
}

export type ConversationEmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export function ConversationEmptyState({
  className,
  title,
  description,
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      data-slot="conversation-empty-state"
      className={cn(
        "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon ? <div className="text-primary">{icon}</div> : null}
          <div className="grid gap-1">
            <h3 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
              {title}
            </h3>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export function ConversationScrollButton({ className, ...props }: ConversationScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const onClick = useCallback(() => scrollToBottom(), [scrollToBottom]);
  if (isAtBottom) return null;
  return (
    <Button
      data-slot="conversation-scroll-button"
      type="button"
      variant="outline"
      size="icon"
      className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full", className)}
      onClick={onClick}
      {...props}
    >
      <ArrowDownIcon />
    </Button>
  );
}
