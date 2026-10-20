import type { OperationContext } from "../../operations/types";
import { toGroupDtos } from "./to-group-dto";

export type ArchiveGroupsOfTicketInput = { context: OperationContext; ticketId: string };

/**
 * Archives the ticket's alternative groups with the ticket (one audit row each). Their options
 * are archived with the ticket's lines and keep `alternativeGroupId` as history.
 */
export async function archiveGroupsOfTicket({
  context,
  ticketId,
}: ArchiveGroupsOfTicketInput): Promise<void> {
  const rows = await context.db.alternativeGroup.findMany({ where: { ticketId } });
  const groups = await toGroupDtos({ context, rows });
  for (const before of groups) {
    const row = await context.db.alternativeGroup.update({
      where: { id: before.id },
      data: { status: "ARCHIVED" },
    });
    const after = { ...row, optionLineIds: [] };
    context.recordChange({ entityType: "alternativeGroup", entityId: row.id, before, after });
  }
}
