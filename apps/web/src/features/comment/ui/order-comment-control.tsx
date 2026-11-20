import type { OrderDto } from "@bibi/core";
import { loadOrderComments } from "../load-order-comments";
import { CommentHashButton } from "./comment-hash-button";

export type OrderCommentControlProps = { order: Pick<OrderDto, "id"> };

/**
 * The order's comment icon on its title row (ADR 0115): a red dot for the caller's unread
 * comments anywhere on the order; a click goes down to the Comments section, which reads them
 * once it is on screen. Nothing without `comment:read`.
 */
export async function OrderCommentControl({ order }: OrderCommentControlProps) {
  const state = await loadOrderComments({ order });
  if (!state.ok || !state.value) return null;
  const { comments, unread } = state.value;
  return (
    <CommentHashButton
      lineId={null}
      count={comments.length}
      unread={unread.length > 0}
      look="icon"
    />
  );
}
