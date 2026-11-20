import type { OrderDto } from "@bibi/core";
import { loadOrderComments } from "../load-order-comments";
import { CommentDialogButton } from "./comment-dialog-button";

export type OrderCommentControlProps = { order: Pick<OrderDto, "id">; title: string };

/**
 * The order's comment icon on its title row (ADR 0115): comments on the whole order, a red dot
 * for the caller's unread ones; it opens them with a text box. Nothing without `comment:read`.
 */
export async function OrderCommentControl({ order, title }: OrderCommentControlProps) {
  const state = await loadOrderComments({ order });
  if (!state.ok || !state.value) return null;
  return <CommentDialogButton comments={state.value} lineId={null} title={title} />;
}
