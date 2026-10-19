import type { Prisma, TicketTemplate, TicketTemplateLine } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { WITH_RECORD_LINKS, type WithRecordLinks, withLinks } from "../../records/record-links";
import type { TicketTemplateDto } from "./schema";

/** Prisma `include` that loads a template's lines in order. */
export const WITH_LINES = {
  lines: { orderBy: [{ position: "asc" }, { id: "asc" }] },
  ...WITH_RECORD_LINKS,
} satisfies Prisma.TicketTemplateInclude;

type Row = TicketTemplate & WithRecordLinks & { lines: readonly TicketTemplateLine[] };

export type ToTicketTemplateDtoInput = { row: Row };

export const toTicketTemplateDto = ({
  row: { record: _record, ...row },
}: ToTicketTemplateDtoInput): TicketTemplateDto => ({
  ...row,
  fields: withLinks({ fields: row.fields, links: _record.links }),
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
