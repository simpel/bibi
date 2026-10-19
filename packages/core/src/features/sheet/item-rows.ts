import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS } from "../../records/record-links";
import { effectiveQuantity } from "../line/effective-values";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import type { SheetRow } from "./schema";

const HEADCOUNT = { estimatedHeadcount: true, guaranteedHeadcount: true } as const;

export type ItemRowsInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  definition: Pick<SheetDefinitionDto, "entityTypeIds" | "fieldIds">;
};

/**
 * One row per line of the ticket that uses an item of an included type and is in a state
 * with `inSheets` (ADR 0044), with the included fields of that item's type, earliest first
 * (untimed lines last). A line without a quantity counts the ticket's headcount (ADR 0052).
 */
export async function itemRows({
  context,
  ticketId,
  definition,
}: ItemRowsInput): Promise<SheetRow[]> {
  const [fields, lines, ticket] = await Promise.all([
    context.db.fieldDefinition.findMany({
      where: { id: { in: definition.fieldIds } },
      select: { entityTypeId: true, key: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
    context.db.line.findMany({
      where: {
        ticketId,
        item: { entityTypeId: { in: definition.entityTypeIds } },
        // Only lines whose state the organization marked as sendable (ADR 0044).
        state: { inSheets: true },
      },
      include: { item: { include: WITH_RECORD_LINKS } },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    context.db.ticket.findFirst({ where: { id: ticketId }, select: HEADCOUNT }),
  ]);
  const headcount = ticket ?? { estimatedHeadcount: null, guaranteedHeadcount: null };
  return lines.map(({ item, ...row }) => {
    const own = item ? recordFields({ row: item }) : {};
    const keys = fields.filter((field) => field.entityTypeId === item?.entityTypeId);
    return {
      kind: "ITEM",
      key: row.id,
      parentKey: null,
      label: row.name,
      itemName: item?.name ?? null,
      quantity: effectiveQuantity({ quantity: row.quantity, ticket: headcount }).value,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      values: Object.fromEntries(keys.map(({ key }) => [key, own[key] ?? null])),
    };
  });
}
