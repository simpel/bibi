import type { OperationContext } from "../../operations/types";
import { toGroupDtos } from "./to-group-dto";

export type ArchiveGroupsOfOrderInput = { context: OperationContext; orderId: string };

/**
 * Archives the order's alternative groups with the order (one audit row each). Their options
 * are archived with the order's lines and keep `alternativeGroupId` as history.
 */
export async function archiveGroupsOfOrder({
  context,
  orderId,
}: ArchiveGroupsOfOrderInput): Promise<void> {
  const rows = await context.db.alternativeGroup.findMany({ where: { orderId } });
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
