import "server-only";
import { listEntityTypes, listItems, listTicketPhases, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import type { TicketTemplateFormData } from "./ui/ticket-template-form-data";

const LIMIT = 100;

/**
 * What the template form picks from: ticket types, line types, the phases a ticket can
 * start in (not terminal) and the catalog's items. Items are optional: without read access
 * the lines have no item to pick.
 */
export async function loadTicketTemplateData(): Promise<Result<TicketTemplateFormData>> {
  const [ticketTypes, lineTypes, phases, items] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "TICKET", limit: LIMIT } }),
    runOperation({ operation: listEntityTypes, input: { base: "LINE", limit: LIMIT } }),
    runOperation({ operation: listTicketPhases, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { limit: LIMIT } }),
  ]);
  if (!ticketTypes.ok) return ticketTypes;
  if (!lineTypes.ok) return lineTypes;
  if (!phases.ok) return phases;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      ticketTypes: ticketTypes.value.items.map(named),
      lineTypes: lineTypes.value.items.map(named),
      phases: phases.value.items.filter(({ terminal }) => !terminal).map(named),
      items: items.ok ? items.value.items.map(named) : [],
    },
  };
}
