import type { Line } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { LineRecord } from "./schema";

export type ToLineRecordInput = { row: Line };

export const toLineRecord = ({ row }: ToLineRecordInput): LineRecord => ({
  ...row,
  discountPercent: row.discountPercent === null ? null : row.discountPercent.toNumber(),
  fields: asFieldValues({ value: row.fields }),
});

export type LoadLineInput = { context: Pick<OperationContext, "db">; id: string };

/** The active line, or null when missing, archived or in another organization. */
export async function loadLine({ context, id }: LoadLineInput): Promise<LineRecord | null> {
  const row = await context.db.line.findFirst({ where: { id } });
  return row ? toLineRecord({ row }) : null;
}
