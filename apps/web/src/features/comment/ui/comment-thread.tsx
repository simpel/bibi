"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import type { CommentView, OrderComments } from "./comment-view";

export type CommentThreadProps = {
  state: OrderComments;
  /** Only this line's comments (null = the whole order's); omitted = every comment. */
  lineId?: string | null;
  /** The section's composer: a `#comment-<lineId>` hash picks that line and focuses it. */
  followHash?: boolean;
};

/** Top-level comments oldest first, each with its replies; a reply to a deleted one stands alone. */
function threads({ comments }: { comments: CommentView[] }) {
  const ids = new Set(comments.map((comment) => comment.id));
  const isTop = ({ parentCommentId }: CommentView) => !parentCommentId || !ids.has(parentCommentId);
  return comments.filter(isTop).map((top) => ({
    top,
    replies: comments.filter((c) => !isTop(c) && c.parentCommentId === top.id),
  }));
}

/** Comments with their replies and a Reply link, then the composer below them (ADR 0115). */
export function CommentThread({ state, lineId, followHash = false }: CommentThreadProps) {
  const t = useTranslations("comment");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const comments =
    lineId === undefined ? state.comments : state.comments.filter((c) => c.lineId === lineId);
  const showLine = lineId === undefined;
  return (
    <div className="grid gap-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {threads({ comments }).map(({ top, replies }) => (
            <li key={top.id}>
              <CommentItem
                comment={top}
                showLine={showLine}
                people={state.people}
                onReply={state.canWrite ? () => setReplyTo(top.id) : undefined}
              />
              {replies.length > 0 || replyTo === top.id ? (
                <div className="mb-3 ml-4 grid border-l pl-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      showLine={false}
                      people={state.people}
                    />
                  ))}
                  {replyTo === top.id ? (
                    <div className="py-3">
                      <CommentComposer
                        orderId={state.orderId}
                        lines={state.lines}
                        people={state.people}
                        parentCommentId={top.id}
                        fixedLineId={top.lineId}
                        onDone={() => setReplyTo(null)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {state.canWrite ? (
        <CommentComposer
          orderId={state.orderId}
          lines={state.lines}
          people={state.people}
          fixedLineId={lineId}
          followHash={followHash}
        />
      ) : null}
    </div>
  );
}
