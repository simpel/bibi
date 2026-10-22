import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkAssign } from "./assign-rules";
import { LineAllocationAssignInputSchema, LineAllocationSchema } from "./schema";
import { syncAllocations } from "./sync-allocations";

export const assignLineAllocation = defineOperation({
  name: "lineAllocation.assign",
  kind: "command",
  description:
    "Choose the unit for one allocation of a line (ADR 0059), e.g. another technician than the " +
    "prepicked one; item.freeUnits lists the free units of the demand's target. The unit is held " +
    "for the demand's windows of the line with the line's hold kind. A unit that is not free in " +
    "those windows, or null on a mandatory demand, gives CONFLICT naming the pool and window. " +
    "The new unit's own demands are allocated in turn (a chained demand); the old unit's go.",
  input: LineAllocationAssignInputSchema,
  output: LineAllocationSchema,
  permission: "program:write",
  handler: async ({ input: { id, unitId }, context }) => {
    const before = await context.db.lineAllocation.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Allocation" });
    const checked = await checkAssign({ context, allocation: before, unitId });
    if (!checked.ok) return checked;
    const row = await context.db.lineAllocation.update({ where: { id }, data: { unitId } });
    context.recordChange({ entityId: id, before, after: row });
    const synced = await syncAllocations({ context, lineId: before.lineId });
    if (!synced.ok) return synced;
    const after = await context.db.lineAllocation.findFirst({ where: { id } });
    return after ? ok({ value: after }) : notFound({ entity: "Allocation" });
  },
});
