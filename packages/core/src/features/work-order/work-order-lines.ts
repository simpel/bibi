import { ITEM_SUB_LINE_ROLES } from "../line/line-role";

export type WorkOrderLinesWhereInput = { ticketId: string; entityTypeIds: readonly string[] };

/**
 * The ticket's lines a work order reads: those whose item is active and of an included type, in a
 * state the organization marked as sendable (ADR 0044). A bundle line with part lines is left out:
 * its part (or option) lines stand for it, so nothing is counted twice (ADR 0059). Add-ons are
 * sold on top and never hide their parent (ADR 0088).
 */
export const workOrderLinesWhere = ({ ticketId, entityTypeIds }: WorkOrderLinesWhereInput) => ({
  ticketId,
  item: { status: "ACTIVE" as const, entityTypeId: { in: [...entityTypeIds] } },
  state: { inWorkOrders: true },
  partLines: { none: { status: "ACTIVE" as const, role: { in: ITEM_SUB_LINE_ROLES } } },
});
