import type { Sheet } from "@okazi/db";
import type { SheetChange, SheetContent, SheetDto, SheetMatch } from "./schema";

/** Recipients in the order they were snapshotted; load every sheet with it. */
export const SHEET_INCLUDE = {
  recipients: {
    select: { userId: true, role: true },
    orderBy: { position: "asc" as const },
  },
};

/** A sheet row with its recipients (`SHEET_INCLUDE`). */
export type SheetWithRecipients = Sheet & { recipients: SheetDto["recipients"] };

export type ToSheetDtoInput = { row: SheetWithRecipients };

/** The row with its snapshot columns typed; only core writes them, in the shapes of `schema.ts`. */
export const toSheetDto = ({ row }: ToSheetDtoInput): SheetDto => ({
  ...row,
  content: row.content as SheetContent,
  changes: row.changes as SheetChange[],
  matches: row.matches as SheetMatch[],
});
