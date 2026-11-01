import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import type { TicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-template";
import { getTicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-templates";
import { insertTicketStatus, ticketStatusNameTaken } from "./insert-ticket-status";
import { loadTicketStatus } from "./load-ticket-status";
import { replaceGates } from "./replace-gates";
import {
  type TicketStatusDto,
  type TicketStatusImportResult,
  TicketStatusImportTemplateInputSchema,
  TicketStatusImportTemplateOutputSchema,
} from "./schema";

type TemplateInput = { context: OperationContext; template: TicketStatusTemplate };

type AddGatesInput = {
  context: OperationContext;
  template: TicketStatusTemplate;
  created: TicketStatusDto[];
};

/**
 * Sets the template's gates on moves into the statuses this import created, from any status
 * (ADR 0076); statuses that existed before keep theirs. Audited on each gated status.
 */
async function addGates({ context, template, created }: AddGatesInput) {
  let count = 0;
  const statuses: TicketStatusDto[] = [];
  for (const status of created) {
    const gatesIn = template.statuses.find(({ name }) => name === status.name)?.gatesIn ?? [];
    if (gatesIn.length === 0) {
      statuses.push(status);
      continue;
    }
    const gates = [{ fromStatusId: null, gates: [...gatesIn] }];
    await replaceGates({ context, toStatusId: status.id, gates });
    const after = await loadTicketStatus({ context, id: status.id });
    if (after) context.recordChange({ entityId: status.id, before: status, after });
    statuses.push(after ?? status);
    count += gatesIn.length;
  }
  return { count, statuses };
}

/** The quote events an active status already has; the import never takes one from it. */
async function eventsInUse({ context }: { context: OperationContext }) {
  const rows = await context.db.ticketStatus.findMany({ where: { event: { not: null } } });
  return new Set(rows.flatMap((row) => (row.event ? [row.event] : [])));
}

/**
 * Shared by `ticketStatus.importTemplate` and organization provisioning. An organization that
 * already has an entry status or a quote event status keeps it: the template's flag is then dropped.
 */
export async function importTicketStatuses({
  context,
  template,
}: TemplateInput): Promise<Result<TicketStatusImportResult>> {
  const created = [];
  const skipped: string[] = [];
  const hasEntry = (await context.db.ticketStatus.count({ where: { entry: true } })) > 0;
  const takenEvents = await eventsInUse({ context });
  for (const ticketStatus of template.statuses) {
    if (await ticketStatusNameTaken({ context, name: ticketStatus.name })) {
      skipped.push(ticketStatus.name);
      continue;
    }
    const entry = ticketStatus.entry === true && !hasEntry;
    const event =
      ticketStatus.event && !takenEvents.has(ticketStatus.event) ? ticketStatus.event : null;
    const { gatesIn: _gatesIn, ...fields } = ticketStatus;
    const inserted = await insertTicketStatus({ context, ...fields, entry, event, ownPhase: true });
    if (!inserted.ok) return inserted;
    created.push(inserted.value);
  }
  const added = await addGates({ context, template, created });
  return ok({ value: { created: added.statuses, skipped, gatesAdded: added.count } });
}

export const importTicketStatusTemplate = defineOperation({
  name: "ticketStatus.importTemplate",
  kind: "command",
  description:
    "Import a ticket status template as ordinary, editable statuses with their flags and " +
    "free movement and the template's gates on moves into a status. Statuses whose name already " +
    "exists are skipped and keep their moves and gates. An existing entry " +
    "status stays the entry status, and a quote event that a status has stays with it.",
  input: TicketStatusImportTemplateInputSchema,
  output: TicketStatusImportTemplateOutputSchema,
  permission: "pipeline:write",
  handler: ({ input, context }) =>
    importTicketStatuses({ context, template: getTicketStatusTemplate({ key: input.template }) }),
});
