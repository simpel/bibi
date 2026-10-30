import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import type { TicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-template";
import { getTicketStatusTemplate } from "../../templates/ticket-statuses/ticket-status-templates";
import { createTransition } from "./create-transition";
import type { TransitionGate } from "./gate-schema";
import { insertTicketStatus, ticketStatusNameTaken } from "./insert-ticket-status";
import { loadAllTicketStatuses } from "./load-ticket-status";
import {
  type TicketStatusDto,
  type TicketStatusImportResult,
  TicketStatusImportTemplateInputSchema,
  TicketStatusImportTemplateOutputSchema,
} from "./schema";

type TemplateInput = { context: OperationContext; template: TicketStatusTemplate };

type RecordInput = { context: OperationContext; before: TicketStatusDto[] };

/** Audits every status whose allowed targets changed; returns the statuses as they are now. */
async function recordTransitionChanges({ context, before }: RecordInput) {
  const after = await loadAllTicketStatuses({ context });
  for (const ticketStatus of after) {
    const previous = before.find((candidate) => candidate.id === ticketStatus.id);
    if (previous && previous.transitionsTo.join() === ticketStatus.transitionsTo.join()) continue;
    context.recordChange({ entityId: ticketStatus.id, before: previous, after: ticketStatus });
  }
  return after;
}

type NewTransition = { fromStatusId: string; toStatusId: string; gates: readonly TransitionGate[] };

/** The template's transitions between active statuses with its names that do not exist yet. */
function newTransitions({
  template,
  before,
}: {
  template: TicketStatusTemplate;
  before: TicketStatusDto[];
}) {
  const byName = new Map(before.map((ticketStatus) => [ticketStatus.name, ticketStatus]));
  const gatesIn = new Map(template.statuses.map((status) => [status.name, status.gatesIn ?? []]));
  return template.transitions.flatMap(([from, to]): NewTransition[] => {
    const [fromStatus, toStatus] = [byName.get(from), byName.get(to)];
    if (!fromStatus || !toStatus || fromStatus.transitionsTo.includes(toStatus.id)) return [];
    return [{ fromStatusId: fromStatus.id, toStatusId: toStatus.id, gates: gatesIn.get(to) ?? [] }];
  });
}

/**
 * Adds the template's transitions between the active statuses with its names, each with the gates
 * of its target (`gatesIn`); existing transitions and their gates are kept.
 */
async function addTransitions({ context, template }: TemplateInput) {
  const before = await loadAllTicketStatuses({ context });
  const added = newTransitions({ template, before });
  for (const transition of added) await createTransition({ context, ...transition });
  return { count: added.length, statuses: await recordTransitionChanges({ context, before }) };
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
  const added = await addTransitions({ context, template });
  const withTransitions = created.map(
    (ticketStatus) =>
      added.statuses.find((candidate) => candidate.id === ticketStatus.id) ?? ticketStatus,
  );
  return ok({ value: { created: withTransitions, skipped, transitionsAdded: added.count } });
}

export const importTicketStatusTemplate = defineOperation({
  name: "ticketStatus.importTemplate",
  kind: "command",
  description:
    "Import a ticket status template as ordinary, editable statuses with their flags and " +
    "transitions with their gates. Statuses whose name already exists are skipped; the template's transitions " +
    "between statuses with its names are added, existing transitions are kept. An existing entry " +
    "status stays the entry status, and a quote event that a status has stays with it.",
  input: TicketStatusImportTemplateInputSchema,
  output: TicketStatusImportTemplateOutputSchema,
  permission: "pipeline:write",
  handler: ({ input, context }) =>
    importTicketStatuses({ context, template: getTicketStatusTemplate({ key: input.template }) }),
});
