import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkMembers } from "../../shared/check-members";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";

export type CheckFilterInput = {
  context: Pick<OperationContext, "db">;
  entityTypeId: string | null | undefined;
  assigneeId: string | null | undefined;
};

/** A board filter names an active ticket type and a member of the organization, when set. */
export async function checkBoardFilter({
  context,
  entityTypeId,
  assigneeId,
}: CheckFilterInput): Promise<Result<true>> {
  if (entityTypeId) {
    const type = await loadTypeOfBase({ context, entityTypeId, base: "TICKET" });
    if (!type.ok) return type;
  }
  const members = await checkMembers({ context, userIds: { assigneeId } });
  if (!members.ok) return members;
  return ok({ value: true });
}
