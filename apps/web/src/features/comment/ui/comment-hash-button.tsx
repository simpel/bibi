"use client";

import { CommentAction } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { commentAnchor } from "../lib/comment-anchor";

export type CommentHashButtonProps = {
  /** The line to comment on; null = the whole order. */
  lineId: string | null;
  count: number;
  unread: boolean;
};

/**
 * A comment icon on the order page itself, where a dialog cannot live (a hover card closes): it
 * sets `#comment-<lineId>`, and the Comments section's composer picks that line (ADR 0115).
 */
export function CommentHashButton({ lineId, count, unread }: CommentHashButtonProps) {
  const t = useTranslations("comment");
  return (
    <CommentAction
      label={t("actionLabel", { count, unread: unread ? 1 : 0 })}
      count={count}
      unread={unread}
      onClick={() => {
        window.location.hash = commentAnchor({ lineId });
      }}
    />
  );
}
