import type { Sheet } from "@okazi/db";
import type { SheetChange, SheetContent, SheetDto, SheetMatch } from "./schema";

export type ToSheetDtoInput = { row: Sheet };

/** The row with its snapshot columns typed; only core writes them, in the shapes of `schema.ts`. */
export const toSheetDto = ({ row }: ToSheetDtoInput): SheetDto => ({
  ...row,
  content: row.content as SheetContent,
  changes: row.changes as SheetChange[],
  matches: row.matches as SheetMatch[],
});
