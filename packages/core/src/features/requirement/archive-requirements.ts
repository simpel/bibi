import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { REQUIREMENT_INCLUDE, toRequirementDto } from "./to-requirement-dto";

/** Exactly one parent: the ticket (its own requirements and those on its lines) or one line. */
export type ArchiveRequirementsInput = {
  context: OperationContext;
} & ({ ticketId: string; lineId?: never } | { lineId: string; ticketId?: never });

/**
 * Archives every active requirement under an archived parent (a line or a ticket), one audit row
 * each, so no active requirement remains under an archived parent (#215). Shared by `line.archive`
 * and `archiveTicket`.
 */
export async function archiveRequirements({
  context,
  ticketId,
  lineId,
}: ArchiveRequirementsInput): Promise<number> {
  const where = lineId ? { lineId } : { ticketId };
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
