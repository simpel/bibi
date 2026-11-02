import type { Prisma, TicketTemplate, TicketTemplateLine } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { WITH_RECORD_LINKS, type WithRecordLinks, withLinks } from "../../records/record-links";
import { lineDefaults } from "./line-defaults";
import type { TicketTemplateDto } from "./schema";

const BY_POSITION = [{ position: "asc" }, { id: "asc" }] as const;

/** Prisma `include` that loads a template's lines in order, with their defaults (ADR 0089). */
export const WITH_LINES = {
  lines: {
    orderBy: [...BY_POSITION],
    include: {
      options: { orderBy: [...BY_POSITION], select: { itemId: true } },
      item: {
        select: {
          customisationGroups: {
            select: { maxPick: true, split: true, options: { select: { itemId: true } } },
          },
        },
      },
    },
  },
  ...WITH_RECORD_LINKS,
} satisfies Prisma.TicketTemplateInclude;

type Group = { maxPick: number; split: boolean; options: { itemId: string }[] };

type LineRow = TicketTemplateLine & {
  options: { itemId: string }[];
  item: { customisationGroups: Group[] } | null;
};

type Row = TicketTemplate & WithRecordLinks & { lines: readonly LineRow[] };

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
    options: lineDefaults({
      itemIds: rest.options.map((option) => option.itemId),
      groups: rest.item?.customisationGroups ?? [],
    }),
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
