import type { Prisma, TicketTemplate, TicketTemplateLine } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { TicketTemplateDto } from "./schema";

/** Prisma `include` that loads a template's lines in order. */
export const WITH_LINES = {
  lines: { orderBy: [{ position: "asc" }, { id: "asc" }] },
} satisfies Prisma.TicketTemplateInclude;

type Row = TicketTemplate & { lines: readonly TicketTemplateLine[] };

export type ToTicketTemplateDtoInput = { row: Row };

export const toTicketTemplateDto = ({ row }: ToTicketTemplateDtoInput): TicketTemplateDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
  lines: row.lines.map(({ id, position, entityTypeId, name, itemId, setupId, ...rest }) => ({
    ...{ id, position, entityTypeId, name, itemId, setupId },
    offsetMinutes: rest.offsetMinutes,
    durationMinutes: rest.durationMinutes,
    quantity: rest.quantity,
  })),
});

export type LoadTicketTemplateInput = { context: Pick<OperationContext, "db">; id: string };

/** The active template with its lines, or null when missing, archived or in another organization. */
export async function loadTicketTemplate({
  context,
  id,
}: LoadTicketTemplateInput): Promise<TicketTemplateDto | null> {
  const row = await context.db.ticketTemplate.findFirst({ where: { id }, include: WITH_LINES });
  return row ? toTicketTemplateDto({ row }) : null;
}
