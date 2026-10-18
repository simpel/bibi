import type { Ticket } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { itemRows } from "./item-rows";
import { requirementRows } from "./requirement-rows";
import type { SheetContent } from "./schema";

export type BuildSheetContentInput = {
  context: Pick<OperationContext, "db">;
  ticket: Ticket;
  definition: SheetDefinitionDto;
};

/**
 * The snapshot a sheet version holds: the ticket, then what the definition includes (items of
 * its types with its fields, counts of its lists). Reads current data only; nothing is written.
 */
export async function buildSheetContent({
  context,
  ticket,
  definition,
}: BuildSheetContentInput): Promise<SheetContent> {
  const [items, requirements] = await Promise.all([
    itemRows({ context, ticketId: ticket.id, definition }),
    requirementRows({ context, ticketId: ticket.id, definition }),
  ]);
  const head = {
    kind: "TICKET",
    key: ticket.id,
    parentKey: null,
    label: String(ticket.reference),
    itemName: null,
    quantity: ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount ?? ticket.quantity,
    startsAt: ticket.desiredStartsAt?.toISOString() ?? null,
    endsAt: ticket.desiredEndsAt?.toISOString() ?? null,
    values: {},
  } as const;
  return { rows: [head, ...items, ...requirements] };
}
