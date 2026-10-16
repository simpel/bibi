import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toOccupancyDto } from "./to-occupancy-dto";

export type ReleaseBySourceInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
  /** The record that holds the occupancy, e.g. a booking, program item or option. */
  sourceType: string;
  sourceId: string;
};

/** Releases (archives) every active occupancy the source holds, with one audit change per row. */
export async function releaseOccupancyBySource({
  context,
  sourceType,
  sourceId,
}: ReleaseBySourceInput): Promise<Result<true>> {
  const rows = await context.db.occupancy.updateManyAndReturn({
    where: { sourceType, sourceId },
    data: { status: "ARCHIVED" },
  });
  for (const row of rows) {
    const after = toOccupancyDto({ row });
    const before = { ...after, status: "ACTIVE" };
    context.recordChange({ entityType: "occupancy", entityId: row.id, before, after });
  }
  return ok({ value: true });
}
