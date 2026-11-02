import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS } from "../../records/record-links";
import { effectiveQuantity } from "../line/effective-values";
import { inheritsParentQuantity } from "../line/line-role";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import type { SheetRow } from "./schema";
import { sheetLinesWhere } from "./sheet-lines";

const HEADCOUNT = { estimatedHeadcount: true, guaranteedHeadcount: true } as const;

export type ItemRowsInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  definition: Pick<SheetDefinitionDto, "entityTypeIds" | "fieldIds">;
};

/**
 * One row per line of the ticket that uses an item of an included type and is in a state
 * with `inSheets` (ADR 0044), part lines included and their bundle line not (ADR 0059), with
 * the included fields of that item's type, earliest first
 * (untimed lines last). A line without a quantity counts the ticket's headcount (ADR 0052), an
 * option line its parent's (so a split choice lists 10 of one and 4 of another, ADR 0082).
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
      where: sheetLinesWhere({ ticketId, entityTypeIds: definition.entityTypeIds }),
      include: {
        item: { include: WITH_RECORD_LINKS },
        parentLine: { select: { quantity: true } },
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    context.db.ticket.findFirst({ where: { id: ticketId }, select: HEADCOUNT }),
  ]);
  const headcount = ticket ?? { estimatedHeadcount: null, guaranteedHeadcount: null };
  return lines.map(({ item, parentLine, ...row }) => {
    // An option or add-on line without its own quantity counts its parent's (ADR 0082, 0088).
    const parent = inheritsParentQuantity(row) ? parentLine : null;
    const own = item ? recordFields({ row: item }) : {};
    const keys = fields.filter((field) => field.entityTypeId === item?.entityTypeId);
    return {
      kind: "ITEM",
      key: row.id,
      parentKey: null,
      label: row.name,
      itemName: item?.name ?? null,
      quantity: effectiveQuantity({ quantity: row.quantity, ticket: headcount, parent }).value,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      values: Object.fromEntries(keys.map(({ key }) => [key, own[key] ?? null])),
    };
  });
}
