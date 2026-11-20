import type { OperationContext } from "../../operations/types";

/** The notifications a comment makes (ADR 0115): added or replied, and mentioned. */
const COMMENT_KINDS = ["COMMENT_ADDED", "COMMENT_MENTIONED"] as const;

export type CommentSummary = { count: number; unread: number };

export type CommentSummariesInput = {
  context: Pick<OperationContext, "db" | "actor">;
  orderIds: readonly string[];
};

/**
 * Per order: its active comments, and the caller's unread comment notifications on it (ADR 0115).
 * Unread is the caller's own: every person reads their notifications on their own.
 */
export async function commentSummaries({
  context,
  orderIds,
}: CommentSummariesInput): Promise<Map<string, CommentSummary>> {
  const ids = [...orderIds];
  const userId = context.actor.userId;
  const [counts, unread] = await Promise.all([
    context.db.comment.groupBy({ by: ["orderId"], where: { orderId: { in: ids } }, _count: true }),
    userId
      ? context.db.notification.groupBy({
          by: ["orderId"],
          where: {
            orderId: { in: ids },
            recipientUserId: userId,
            kind: { in: [...COMMENT_KINDS] },
            readAt: null,
          },
          _count: true,
        })
      : Promise.resolve([]),
  ]);
  const summaries = new Map<string, CommentSummary>();
  for (const row of counts) summaries.set(row.orderId, { count: row._count, unread: 0 });
  for (const row of unread) {
    if (!row.orderId) continue;
    const summary = summaries.get(row.orderId) ?? { count: 0, unread: 0 };
    summaries.set(row.orderId, { ...summary, unread: row._count });
  }
  return summaries;
}
