export type SheetLinesWhereInput = { ticketId: string; entityTypeIds: readonly string[] };

/**
 * The ticket's lines a sheet reads: those whose item is active and of an included type, in a
 * state the organization marked as sendable (ADR 0044). A bundle line with part lines is left out:
 * its part lines stand for it, so nothing is counted twice (ADR 0059).
 */
export const sheetLinesWhere = ({ ticketId, entityTypeIds }: SheetLinesWhereInput) => ({
  ticketId,
  item: { status: "ACTIVE" as const, entityTypeId: { in: [...entityTypeIds] } },
  state: { inSheets: true },
  partLines: { none: { status: "ACTIVE" as const } },
});
