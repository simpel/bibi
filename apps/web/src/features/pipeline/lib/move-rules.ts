import type { PipelineCard, PipelineColumn } from "@bibi/core";

export type MoveRuleInput = {
  card: PipelineCard;
  from: PipelineColumn;
  to: PipelineColumn;
  /** The organization's ticket phase transitions: phase id → ids it may move to. */
  transitions: Readonly<Record<string, readonly string[]>>;
};

/**
 * Which drops the board accepts (ADR 0041, 0043): a move the organization allows out of an open
 * phase. A phase that requires a reason opens a dialog that asks for it; core checks every other
 * phase flag and refuses with the blockers, which a dialog lists.
 */
export function canMoveCard({ card, from, to, transitions }: MoveRuleInput): boolean {
  if (from.closed || from.id === to.id || card.columnId !== from.id) return false;
  return transitions[from.id]?.includes(to.id) ?? false;
}
