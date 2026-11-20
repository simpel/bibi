import "server-only";
import {
  listComments,
  listMembers,
  listNotifications,
  type OrderDto,
  type Result,
} from "@bibi/core";
import { cache } from "react";
import { loadOrderLines } from "@/features/line/load-order-lines";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import type { CommentView, OrderComments } from "./ui/comment-view";

const LIMIT = 100;

const loadCached = cache(async (orderId: string): Promise<Result<OrderComments | null>> => {
  const abilities = await getCallerAbilities();
  if (!can({ abilities, permission: "comment:read" })) return { ok: true, value: null };
  const unreadInput = { orderId, kind: "COMMENT_ADDED" as const, read: "unread" as const };
  const [comments, unread, lines, members] = await Promise.all([
    runOperation({ operation: listComments, input: { orderId, limit: LIMIT } }),
    runOperation({ operation: listNotifications, input: { ...unreadInput, limit: LIMIT } }),
    can({ abilities, permission: "program:read" }) ? loadOrderLines({ orderId }) : null,
    can({ abilities, permission: "member:read" })
      ? runOperation({ operation: listMembers, input: { limit: LIMIT } })
      : null,
  ]);
  if (!comments.ok) return comments;
  const options = lines?.ok ? lines.value.items.map(({ id, name }) => ({ id, name })) : [];
  const nameOf = new Map(options.map((line) => [line.id, line.name]));
  const canRemoveAny = can({ abilities, permission: "comment:delete" });
  const views: CommentView[] = comments.value.items.map((comment) => {
    const own = comment.createdBy !== null && comment.createdBy === abilities.userId;
    return {
      id: comment.id,
      body: comment.body,
      lineId: comment.lineId,
      lineName: comment.lineId ? (nameOf.get(comment.lineId) ?? null) : null,
      parentCommentId: comment.parentCommentId,
      mentions: comment.mentions.flatMap(({ userId, name }) => (name ? [{ userId, name }] : [])),
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      edited: comment.editedAt !== null,
      canEdit: own,
      canDelete: own || canRemoveAny,
    };
  });
  const ownUnread = unread.ok ? unread.value.items : [];
  return {
    ok: true,
    value: {
      orderId,
      comments: views,
      lines: options,
      people: members?.ok
        ? members.value.items
            .filter((member) => member.userId !== abilities.userId)
            .map(({ userId, name }) => ({ userId, name }))
        : [],
      unread: ownUnread.map((item) => ({ id: item.id, lineId: item.data.lineId ?? null })),
      canWrite: can({ abilities, permission: "comment:write" }),
    },
  };
});

export type LoadOrderCommentsInput = { order: Pick<OrderDto, "id"> };

/**
 * The order's comments, its lines and the caller's unread comment notifications (ADR 0115),
 * cached per request so the program table, the header and the Comments section share one read.
 * Null without `comment:read`.
 */
export function loadOrderComments({ order }: LoadOrderCommentsInput) {
  return loadCached(order.id);
}
