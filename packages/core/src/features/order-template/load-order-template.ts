import type { OrderTemplate, OrderTemplateLine, Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { WITH_RECORD_LINKS, type WithRecordLinks, withLinks } from "../../records/record-links";
import { lineDefaults } from "./line-defaults";
import type { OrderTemplateDto } from "./schema";

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
} satisfies Prisma.OrderTemplateInclude;

type Group = { maxPick: number; split: boolean; options: { itemId: string }[] };

type LineRow = OrderTemplateLine & {
  options: { itemId: string }[];
  item: { customisationGroups: Group[] } | null;
};

type Row = OrderTemplate & WithRecordLinks & { lines: readonly LineRow[] };

export type ToOrderTemplateDtoInput = { row: Row };

export const toOrderTemplateDto = ({
  row: { record: _record, ...row },
}: ToOrderTemplateDtoInput): OrderTemplateDto => ({
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

export type LoadOrderTemplateInput = { context: Pick<OperationContext, "db">; id: string };

/** The active template with its lines, or null when missing, archived or in another organization. */
export async function loadOrderTemplate({
  context,
  id,
}: LoadOrderTemplateInput): Promise<OrderTemplateDto | null> {
  const row = await context.db.orderTemplate.findFirst({ where: { id }, include: WITH_LINES });
  return row ? toOrderTemplateDto({ row }) : null;
}
