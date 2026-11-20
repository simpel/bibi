"use client";

import { useTranslations } from "next-intl";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import type { CommentLineOption, CommentView } from "./comment-view";

export type CommentThreadProps = {
  orderId: string;
  comments: readonly CommentView[];
  lines: readonly CommentLineOption[];
  canWrite: boolean;
};

/** The order's comments, oldest first, with the composer below them. */
export function CommentThread({ orderId, comments, lines, canWrite }: CommentThreadProps) {
  const t = useTranslations("comment");
  return (
    <div className="grid gap-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
      {canWrite ? <CommentComposer orderId={orderId} lines={lines} /> : null}
    </div>
  );
}
