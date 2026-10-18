import type { PipelineCard, PipelineColumn } from "@okazi/core";

export type MoveRuleInput = {
  card: PipelineCard;
  from: PipelineColumn;
  to: PipelineColumn;
  /** The organization's booking status transitions: status id → ids it may move to. */
  transitions: Readonly<Record<string, readonly string[]>>;
};

/**
 * Which drops the board accepts (ADR 0041). Bookings follow the organization's transitions;
 * inquiries only move NEW → QUALIFIED by drag, since QUOTED and WON belong to the quote and the
 * closed lanes need a reason, which the detail pages ask for.
 */
export function canMoveCard({ card, from, to, transitions }: MoveRuleInput): boolean {
  if (to.closed || from.id === to.id) return false;
  if (card.kind === "INQUIRY") {
    return from.inquiryStatus === "NEW" && to.inquiryStatus === "QUALIFIED";
  }
  if (!from.bookingStatusId || !to.bookingStatusId) return false;
  return transitions[from.bookingStatusId]?.includes(to.bookingStatusId) ?? false;
}
