import "server-only";
import { listEntityTypes, listItems, listTicketStatuses, type Result } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { TicketTemplateFormData } from "./ui/ticket-template-form-data";

const LIMIT = 100;

/**
 * What the template form picks from: ticket types, line types, the statuses a ticket can
 * start in (not closing) and the catalog's items. Items are optional: without read access
 * the lines have no item to pick.
 */
export async function loadTicketTemplateData(): Promise<Result<TicketTemplateFormData>> {
  const [ticketTypes, lineTypes, statuses, items] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "TICKET", limit: LIMIT } }),
    runOperation({ operation: listEntityTypes, input: { base: "LINE", limit: LIMIT } }),
    runOperation({ operation: listTicketStatuses, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { limit: LIMIT } }),
  ]);
  if (!ticketTypes.ok) return ticketTypes;
  if (!lineTypes.ok) return lineTypes;
  if (!statuses.ok) return statuses;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      ticketTypes: ticketTypes.value.items.map(named),
      lineTypes: lineTypes.value.items.map(named),
      statuses: statuses.value.items.filter(({ closes }) => !closes).map(named),
      items: items.ok ? items.value.items.map(named) : [],
      itemsHidden: !items.ok,
    },
  };
}
