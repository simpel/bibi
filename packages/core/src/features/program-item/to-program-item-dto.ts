import type { ProgramItem } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { ProgramItemDto } from "./schema";

export type ToProgramItemDtoInput = { row: ProgramItem };

export const toProgramItemDto = ({ row }: ToProgramItemDtoInput): ProgramItemDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadProgramItemInput = { context: Pick<OperationContext, "db">; id: string };

/** The active program item, or null when missing, archived or in another organization. */
export async function loadProgramItem({
  context,
  id,
}: LoadProgramItemInput): Promise<ProgramItemDto | null> {
  const row = await context.db.programItem.findFirst({ where: { id } });
  return row ? toProgramItemDto({ row }) : null;
}
