import type { Ticket } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { WorkOrderDefinitionDto } from "../work-order-definition/schema";
import { itemRows } from "./item-rows";
import { requirementRows } from "./requirement-rows";
import type { WorkOrderContent } from "./schema";

export type BuildWorkOrderContentInput = {
  context: Pick<OperationContext, "db">;
  ticket: Ticket;
  definition: WorkOrderDefinitionDto;
};

/**
 * The snapshot a work order version holds: the ticket, then what the definition includes (items of
 * its types with its fields, counts of its lists). Reads current data only; nothing is written.
 */
export async function buildWorkOrderContent({
  context,
  ticket,
  definition,
}: BuildWorkOrderContentInput): Promise<WorkOrderContent> {
  const [items, requirements] = await Promise.all([
    itemRows({ context, ticketId: ticket.id, definition }),
    requirementRows({ context, ticketId: ticket.id, definition }),
  ]);
  const head = {
    kind: "TICKET",
    key: ticket.id,
    parentKey: null,
    // The title leads; the reference stays so the receiver can quote it back.
    label: ticket.title ? `${ticket.title} · #${ticket.reference}` : String(ticket.reference),
    itemName: null,
    quantity: ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount,
    startsAt: ticket.desiredStartsAt?.toISOString() ?? null,
    endsAt: ticket.desiredEndsAt?.toISOString() ?? null,
    values: {},
  } as const;
  return { rows: [head, ...items, ...requirements] };
}
