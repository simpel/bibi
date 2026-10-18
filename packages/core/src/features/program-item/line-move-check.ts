import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";
import type { ItemStateDto } from "../item-state/schema";
import { holdCollisions } from "./hold-collisions";
import type { ProgramItemDto } from "./schema";

/** One line moving from its state to another state of its item type (ADR 0044). */
export type LineMove = {
  line: ProgramItemDto;
  /** The line's current state; null when it has none yet. */
  from: ItemStateDto | null;
  to: ItemStateDto;
};

/**
 * The type's transitions must allow the move, and nothing leaves a released state. Null when
 * allowed (a line without a state may enter any state).
 */
export function transitionBlocker({ line, from, to }: LineMove): AppErrorIssue | null {
  if (!from || from.transitionsTo.includes(to.id)) return null;
  const why = from.released ? "a released state is final" : "the type's transitions forbid it";
  const message = `"${line.name}" cannot move from ${from.name} to ${to.name}: ${why}`;
  return { path: `lines.${line.id}`, message };
}

export type LineMoveBlockersInput = { context: Pick<OperationContext, "db">; move: LineMove };

/**
 * Everything that blocks one line move (ADR 0044): a transition the type does not allow, or a
 * hard hold that would collide on the line's bookable item. Empty = the move can be applied.
 */
export async function lineMoveBlockers({
  context,
  move,
}: LineMoveBlockersInput): Promise<AppErrorIssue[]> {
  const blocked = transitionBlocker(move);
  if (blocked) return [blocked];
  return holdCollisions({ context, line: move.line, to: move.to });
}
