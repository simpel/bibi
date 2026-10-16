import type { Option } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { OptionDto } from "./schema";

export type ToOptionDtoInput = { row: Option };

/** The wire shape; `sequence` only orders the queue and stays inside core. */
export const toOptionDto = ({ row: { sequence: _sequence, ...rest } }: ToOptionDtoInput) =>
  rest satisfies OptionDto;

export type LoadOptionInput = { context: Pick<OperationContext, "db">; id: string };

/** The option, or null when missing, archived or in another organization. */
export async function loadOption({ context, id }: LoadOptionInput): Promise<OptionDto | null> {
  const row = await context.db.option.findFirst({ where: { id } });
  return row ? toOptionDto({ row }) : null;
}
