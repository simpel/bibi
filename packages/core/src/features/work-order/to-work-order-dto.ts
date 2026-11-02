import type { WorkOrder } from "@bibi/db";
import type { WorkOrderChange, WorkOrderContent, WorkOrderDto, WorkOrderMatch } from "./schema";

/** Recipients in the order they were snapshotted; load every work order with it. */
export const WORK_ORDER_INCLUDE = {
  recipients: {
    select: { userId: true, role: true },
    orderBy: { position: "asc" as const },
  },
};

/** A work order row with its recipients (`WORK_ORDER_INCLUDE`). */
export type WorkOrderWithRecipients = WorkOrder & { recipients: WorkOrderDto["recipients"] };

export type ToWorkOrderDtoInput = { row: WorkOrderWithRecipients };

/** The row with its snapshot columns typed; only core writes them, in the shapes of `schema.ts`. */
export const toWorkOrderDto = ({ row }: ToWorkOrderDtoInput): WorkOrderDto => ({
  ...row,
  content: row.content as WorkOrderContent,
  changes: row.changes as WorkOrderChange[],
  matches: row.matches as WorkOrderMatch[],
});
