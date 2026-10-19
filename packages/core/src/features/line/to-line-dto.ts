import type { Line } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { LineDto } from "./schema";

export type ToLineDtoInput = { row: Line };

export const toLineDto = ({ row }: ToLineDtoInput): LineDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadLineInput = { context: Pick<OperationContext, "db">; id: string };

/** The active line, or null when missing, archived or in another organization. */
export async function loadLine({ context, id }: LoadLineInput): Promise<LineDto | null> {
  const row = await context.db.line.findFirst({ where: { id } });
  return row ? toLineDto({ row }) : null;
}
