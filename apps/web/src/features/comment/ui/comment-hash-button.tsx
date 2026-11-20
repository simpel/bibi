"use client";

import { CommentAction } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { commentAnchor } from "../lib/comment-anchor";

export type CommentHashButtonProps = {
  /** The line to comment on; null = the whole order. */
  lineId: string | null;
  count: number;
  unread: boolean;
  /** `icon` on the title row: an outline icon button with the dot, no count. */
  look?: "inline" | "icon";
};

/**
 * A comment icon on the order page itself: it goes to the Comments section (`#comments`, or
 * `#comment-<lineId>` so the composer picks that line, ADR 0115). Clicking again when the hash is
 * already set still scrolls there.
 */
export function CommentHashButton({ lineId, count, unread, look }: CommentHashButtonProps) {
  const t = useTranslations("comment");
  const unreadCount = unread ? 1 : 0;
  return (
    <CommentAction
      label={
        lineId === null && look === "icon"
          ? t("goToLabel", { count, unread: unreadCount })
          : t("actionLabel", { count, unread: unreadCount })
      }
      count={count}
      unread={unread}
      look={look}
      onClick={() => {
        const hash = `#${commentAnchor({ lineId })}`;
        if (window.location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
        else window.location.hash = hash;
      }}
    />
  );
}
