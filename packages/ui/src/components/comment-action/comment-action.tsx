"use client";

import { MessageCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { Button } from "../button/button";

export type CommentActionProps = {
  /** The accessible name and tooltip, e.g. "Comments (2, 1 new)". */
  label: string;
  /** How many comments there are; shown beside the icon when more than none. */
  count: number;
  /** The viewer has unread comments here: a red dot on the icon. */
  unread?: boolean;
  /** Opens the comments elsewhere; else `onClick` opens them in place. */
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  className?: string;
};

function Content({ count, unread }: Pick<CommentActionProps, "count" | "unread">): ReactNode {
  return (
    <>
      <span className="relative">
        <MessageCircleIcon aria-hidden className="size-3.5" />
        {unread ? (
          <span
            data-slot="comment-unread"
            className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive ring-2 ring-background"
          />
        ) : null}
      </span>
      {count > 0 ? <span className="text-xs tabular-nums">{count}</span> : null}
    </>
  );
}

/**
 * The comments of an order or a line (ADR 0115): an icon with the count and a red dot for the
 * viewer's unread ones. Inside a card that is a link it stops the click from opening the card.
 */
export function CommentAction({
  label,
  count,
  unread,
  href,
  onClick,
  className,
}: CommentActionProps) {
  const look = cn(
    "h-7 shrink-0 gap-1 px-1.5 text-muted-foreground hover:text-foreground",
    unread && "text-foreground",
    className,
  );
  if (href) {
    return (
      <Button
        asChild
        size="sm"
        variant="ghost"
        className={look}
        onClick={(event) => event.stopPropagation()}
        aria-label={label}
        title={label}
      >
        <AppLink href={href} data-slot="comment-action">
          <Content count={count} unread={unread} />
        </AppLink>
      </Button>
    );
  }
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={look}
      data-slot="comment-action"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      title={label}
    >
      <Content count={count} unread={unread} />
    </Button>
  );
}
