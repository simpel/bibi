import type { Line } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import type { LineRecord } from "./schema";

export type LineRow = Line & WithRecordLinks;

export type ToLineRecordInput = { row: LineRow };

/** Prisma `include` for every line read (`toLineRecord`): its `LINK` values. */
export const LINE_INCLUDE = WITH_RECORD_LINKS;

export const toLineRecord = ({ row }: ToLineRecordInput): LineRecord => {
  const { record: _record, ...line } = row;
  return {
    ...line,
    discountPercent: row.discountPercent === null ? null : row.discountPercent.toNumber(),
    fields: recordFields({ row }),
  };
};

export type LoadLineInput = { context: Pick<OperationContext, "db">; id: string };

/** The active line, or null when missing, archived or in another organization. */
export async function loadLine({ context, id }: LoadLineInput): Promise<LineRecord | null> {
  const row = await context.db.line.findFirst({ where: { id }, include: LINE_INCLUDE });
  return row ? toLineRecord({ row }) : null;
}
