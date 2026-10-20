import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type SetOptionsInput = {
  context: Pick<OperationContext, "db">;
  groupId: string;
  lineIds: readonly string[];
};

/**
 * Makes exactly these lines the group's options: left-out options become ordinary lines, and the
 * new ones are claimed only while they are in no other group, so two groups racing for one line
 * give `CONFLICT` instead of both taking it.
 */
export async function setOptions({
  context,
  groupId,
  lineIds,
}: SetOptionsInput): Promise<Result<true>> {
  await context.db.line.updateMany({
    where: { alternativeGroupId: groupId, id: { notIn: [...lineIds] } },
    data: { alternativeGroupId: null },
  });
  const claimed = await context.db.line.updateMany({
    where: {
      id: { in: [...lineIds] },
      OR: [{ alternativeGroupId: null }, { alternativeGroupId: groupId }],
    },
    data: { alternativeGroupId: groupId },
  });
  if (claimed.count === lineIds.length) return ok({ value: true });
  return conflict({ message: "A line is already an option of another alternative group" });
}
