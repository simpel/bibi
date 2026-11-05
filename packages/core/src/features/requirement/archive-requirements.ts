import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { REQUIREMENT_INCLUDE, toRequirementDto } from "./to-requirement-dto";

/** Exactly one parent: the order (its own requirements and those on its lines) or one line. */
export type ArchiveRequirementsInput = {
  context: OperationContext;
} & ({ orderId: string; lineId?: never } | { lineId: string; orderId?: never });

/**
 * Archives every active requirement under an archived parent (a line or an order), one audit row
 * each, so no active requirement remains under an archived parent (#215). Shared by `line.archive`
 * and `archiveOrder`.
 */
export async function archiveRequirements({
  context,
  orderId,
  lineId,
}: ArchiveRequirementsInput): Promise<number> {
  const where = lineId ? { lineId } : { orderId };
  const rows = await context.db.requirement.findMany({ where, include: REQUIREMENT_INCLUDE });
  for (const row of rows) {
    const archived = await context.db.requirement.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
      include: REQUIREMENT_INCLUDE,
    });
    await archiveRecords({ context, ids: [row.id] });
    context.recordChange({
      entityType: "requirement",
      entityId: row.id,
      before: toRequirementDto({ row }),
      after: toRequirementDto({ row: archived }),
    });
  }
  return rows.length;
}
