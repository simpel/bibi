import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { createTransition } from "./create-transition";
import type { TransitionGate, TransitionGates } from "./gate-schema";
import type { TicketStatusDto } from "./schema";

export type ReplaceTransitionsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  /** The status as it is now, with its transitions and their gates. */
  before: TicketStatusDto;
  targets: readonly string[];
  /** Replaces the targets' gates; omitted keeps the gates of the targets that stay. */
  gates: readonly TransitionGates[] | undefined;
};

/** Each target's gates: the given ones, or the current ones when none are given. */
function gatesByTarget({ before, targets, gates }: Omit<ReplaceTransitionsInput, "context">) {
  const source = gates ?? before.transitionGates;
  const byTarget = new Map<string, TransitionGate[]>();
  for (const { toStatusId, gates: keys } of source) {
    if (targets.includes(toStatusId)) byTarget.set(toStatusId, [...new Set(keys)]);
  }
  return byTarget;
}

/**
 * Replaces a status's transitions and their gates as one set (ADR 0067 §5): the old rows go (their
 * gates cascade) and each target gets a transition with its gates. Gates on a target the set does
 * not include are refused.
 */
export async function replaceTransitions({
  context,
  before,
  targets,
  gates,
}: ReplaceTransitionsInput): Promise<Result<true>> {
  const stray = gates?.find(({ toStatusId }) => !targets.includes(toStatusId));
  if (stray) {
    const message = "Gates are only allowed on a transition in `toStatusIds`";
    return invalid({ message, issues: [{ path: "gates", message }] });
  }
  const byTarget = gatesByTarget({ before, targets, gates });
  await context.db.ticketStatusTransition.deleteMany({ where: { fromStatusId: before.id } });
  for (const toStatusId of targets) {
    const gates = byTarget.get(toStatusId) ?? [];
    await createTransition({ context, fromStatusId: before.id, toStatusId, gates });
  }
  return ok({ value: true });
}
