"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type CommentListViewProps = GenerativeProps<"comment-list">;

/** A page of comments, oldest first, as the order page shows them. */
export function CommentListView({ items, nextCursor }: CommentListViewProps) {
  const t = useTranslations("assistant.ui.comment");
  const names = useTranslations("comment");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="comment-list" className="gap-0 p-4 shadow-none">
      <ul className="divide-y">
        {items.map((comment) => (
          <li key={comment.id} className="grid gap-1 py-2 text-sm">
            <span>
              <span className="font-medium">{comment.authorName ?? names("formerMember")}</span>
              <span className="text-muted-foreground">
                {" · "}
                <RelativeTime instant={comment.createdAt} />
                {` · ${comment.lineId ? t("onLine") : t("onOrder")}`}
              </span>
            </span>
            <span className="whitespace-pre-line">{comment.body}</span>
          </li>
        ))}
      </ul>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
