import type { RunSheet } from "@bibi/db";
import type { RunSheetChange, RunSheetContent, RunSheetDto, RunSheetMatch } from "./schema";

/** Recipients in the order they were snapshotted; load every run sheet with it. */
export const RUN_SHEET_INCLUDE = {
  recipients: {
    select: { userId: true, role: true },
    orderBy: { position: "asc" as const },
  },
};

/** A run sheet row with its recipients (`RUN_SHEET_INCLUDE`). */
export type RunSheetWithRecipients = RunSheet & { recipients: RunSheetDto["recipients"] };

export type ToRunSheetDtoInput = { row: RunSheetWithRecipients };

/** The row with its snapshot columns typed; only core writes them, in the shapes of `schema.ts`. */
export const toRunSheetDto = ({ row }: ToRunSheetDtoInput): RunSheetDto => ({
  ...row,
  content: row.content as RunSheetContent,
  changes: row.changes as RunSheetChange[],
  matches: row.matches as RunSheetMatch[],
});
