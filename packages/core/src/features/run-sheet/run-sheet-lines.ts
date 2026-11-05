import { ITEM_SUB_LINE_ROLES } from "../line/line-role";

export type RunSheetLinesWhereInput = { orderId: string; entityTypeIds: readonly string[] };

/**
 * The order's lines a run sheet reads: those whose item is active and of an included type, in a
 * state the organization marked as sendable (ADR 0044). A bundle line with part lines is left out:
 * its part (or option) lines stand for it, so nothing is counted twice (ADR 0059). Add-ons are
 * sold on top and never hide their parent (ADR 0088).
 */
export const runSheetLinesWhere = ({ orderId, entityTypeIds }: RunSheetLinesWhereInput) => ({
  orderId,
  item: { status: "ACTIVE" as const, entityTypeId: { in: [...entityTypeIds] } },
  state: { inRunSheets: true },
  partLines: { none: { status: "ACTIVE" as const, role: { in: ITEM_SUB_LINE_ROLES } } },
});
