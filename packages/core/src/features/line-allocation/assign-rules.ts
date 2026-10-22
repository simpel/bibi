import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { loadDemand } from "../item-demand/to-demand-dto";
import { checkReadable } from "../ticket/ticket-rules";
import { chainShortfall, freeUnitsWhere, unitMatches } from "./free-unit";
import { lineWindows } from "./line-windows";
import { missingUnit } from "./missing-unit";

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "unitId", message }] });

export type CheckAssignInput = {
  context: OperationContext;
  allocation: { id: string; lineId: string; demandId: string };
  unitId: string | null;
};

/**
 * `lineAllocation.assign` (ADR 0059): the caller may read items; a unit belongs to the demand's
 * target, is not already on the line, is free in the demand's windows and its own mandatory
 * demands can be met (the chained check); only an optional demand may be left unfilled. The trigger's exclusion constraint stays the guarantee.
 */
export async function checkAssign({
  context,
  allocation,
  unitId,
}: CheckAssignInput): Promise<Result<true>> {
  const readable = checkReadable({ context, permission: "item:read", path: "unitId" });
  if (!readable.ok) return readable;
  const demand = await loadDemand({ context, id: allocation.demandId });
  if (!demand) return conflict({ message: "The allocation's demand was removed" });
  const { lineId } = allocation;
  if (!unitId) {
    if (!demand.required) return ok({ value: true });
    const message = "A mandatory demand is met only when a unit is allocated";
    return conflict({ message, issues: [{ path: "unitId", message }] });
  }
  if (!(await unitMatches({ context, demand, unitId }))) {
    return problem({ message: "The unit is not one of the demand's target" });
  }
  const line = await context.db.line.findFirst({ where: { id: lineId }, select: { itemId: true } });
  const others = await context.db.lineAllocation.findMany({
    where: { lineId, id: { not: allocation.id }, unitId: { not: null } },
    select: { unitId: true },
  });
  const exclude = [line?.itemId, ...others.map((row) => row.unitId)].flatMap((id) => id ?? []);
  if (exclude.includes(unitId)) return problem({ message: "The unit is already on the line" });
  const windows = await lineWindows({ context, lineId });
  if (!windows) return ok({ value: true });
  const where = await freeUnitsWhere({ context, demand, windows, exclude });
  if (!where.ok) return where;
  const free = await context.db.item.count({ where: { AND: [where.value, { id: unitId }] } });
  if (!free) return missingUnit({ context, demand, windows, lineId });
  const short = await chainShortfall({ context, unitId, windows, exclude });
  return short ? missingUnit({ context, demand: short, windows, lineId }) : ok({ value: true });
}
