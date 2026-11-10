import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { EntityBase } from "./capability-kinds";

export type CheckTypeGroupInput = {
  context: Pick<OperationContext, "db">;
  base: EntityBase;
  /** `undefined` keeps the current one, `null` leaves the type ungrouped. */
  groupId: string | null | undefined;
};

/**
 * A type's group (ADR 0101) is an active item type group, and only item types have one; anything
 * else is a `VALIDATION` issue on `groupId`.
 */
export async function checkTypeGroup({
  context,
  base,
  groupId,
}: CheckTypeGroupInput): Promise<Result<true>> {
  if (!groupId) return ok({ value: true });
  const found =
    base === "ITEM" ? await context.db.itemTypeGroup.count({ where: { id: groupId } }) : 0;
  if (found > 0) return ok({ value: true });
  const message =
    base === "ITEM" ? "Choose an active item type group" : "Only item types have a group";
  return invalid({ message, issues: [{ path: "groupId", message }] });
}
