import type { AppErrorIssue } from "../../errors/app-error";
import type { OperationContext } from "../../operations/types";

type Db = { context: Pick<OperationContext, "db"> };

/** Of the given states, the ones that hard-hold (`hold` HARD and not released, ADR 0044). */
export async function hardStateIds({ context, ids }: Db & { ids: readonly string[] }) {
  if (ids.length === 0) return new Set<string>();
  const rows = await context.db.itemState.findMany({
    where: { id: { in: [...ids] }, hold: "HARD", released: false },
    select: { id: true },
  });
  return new Set(rows.map((row) => row.id));
}

export type GroupHardHoldInput = Db & {
  line: { id: string; name: string; alternativeGroupId: string | null };
  /** The state the line would move to. */
  stateId: string | null;
  /** Lock the group row first, so two options cannot go hard at once (inside a command). */
  lock?: boolean;
};

/**
 * ADR 0052: at most one option of an alternative group may be in a hard-hold state. Null when the
 * line may move to the state; otherwise the issue naming the option that already holds hard.
 */
export async function groupHardHoldBlocker({
  context,
  line,
  stateId,
  lock = false,
}: GroupHardHoldInput): Promise<AppErrorIssue | null> {
  const groupId = line.alternativeGroupId;
  if (!groupId || !stateId) return null;
  if (!(await hardStateIds({ context, ids: [stateId] })).has(stateId)) return null;
  if (lock) {
    // A row lock on the group serializes concurrent moves of its options (READ COMMITTED).
    await context.db.alternativeGroup.updateMany({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });
  }
  const other = await context.db.line.findFirst({
    where: {
      alternativeGroupId: groupId,
      id: { not: line.id },
      state: { hold: "HARD", released: false },
    },
    select: { name: true },
  });
  if (!other) return null;
  const message = `"${line.name}" cannot hold hard: "${other.name}" in the same alternative group already does`;
  return { path: `lines.${line.id}`, message };
}
