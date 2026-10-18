import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import type { TicketPhaseTemplate } from "../../templates/ticket-phases/ticket-phase-template";
import { getTicketPhaseTemplate } from "../../templates/ticket-phases/ticket-phase-templates";
import { insertTicketPhase, ticketPhaseNameTaken } from "./insert-ticket-phase";
import { loadAllTicketPhases } from "./load-ticket-phase";
import {
  type TicketPhaseDto,
  type TicketPhaseImportResult,
  TicketPhaseImportTemplateInputSchema,
  TicketPhaseImportTemplateOutputSchema,
} from "./schema";

type TemplateInput = { context: OperationContext; template: TicketPhaseTemplate };

type RecordInput = { context: OperationContext; before: TicketPhaseDto[] };

/** Audits every phase whose allowed targets changed; returns the phases as they are now. */
async function recordTransitionChanges({ context, before }: RecordInput) {
  const after = await loadAllTicketPhases({ context });
  for (const phase of after) {
    const previous = before.find((candidate) => candidate.id === phase.id);
    if (previous && previous.transitionsTo.join() === phase.transitionsTo.join()) continue;
    context.recordChange({ entityId: phase.id, before: previous, after: phase });
  }
  return after;
}

/** Adds the template's transitions between the active phases with its names; keeps the rest. */
async function addTransitions({ context, template }: TemplateInput) {
  const before = await loadAllTicketPhases({ context });
  const idOf = new Map(before.map((phase) => [phase.name, phase.id]));
  const data = template.transitions.flatMap(([from, to]) => {
    const fromPhaseId = idOf.get(from);
    const toPhaseId = idOf.get(to);
    if (!fromPhaseId || !toPhaseId) return [];
    return [{ organizationId: context.organizationId, fromPhaseId, toPhaseId }];
  });
  const added = await context.db.ticketPhaseTransition.createMany({ data, skipDuplicates: true });
  return { count: added.count, phases: await recordTransitionChanges({ context, before }) };
}

/**
 * Shared by `ticketPhase.importTemplate` and organization provisioning. An organization that
 * already has an entry phase keeps it: the template's entry flag is then dropped.
 */
export async function importTicketPhases({
  context,
  template,
}: TemplateInput): Promise<Result<TicketPhaseImportResult>> {
  const created = [];
  const skipped: string[] = [];
  const hasEntry = (await context.db.ticketPhase.count({ where: { entry: true } })) > 0;
  for (const phase of template.phases) {
    if (await ticketPhaseNameTaken({ context, name: phase.name })) {
      skipped.push(phase.name);
      continue;
    }
    const entry = phase.entry === true && !hasEntry;
    const inserted = await insertTicketPhase({ context, ...phase, entry });
    if (!inserted.ok) return inserted;
    created.push(inserted.value);
  }
  const added = await addTransitions({ context, template });
  const withTransitions = created.map(
    (phase) => added.phases.find((candidate) => candidate.id === phase.id) ?? phase,
  );
  return ok({ value: { created: withTransitions, skipped, transitionsAdded: added.count } });
}

export const importTicketPhaseTemplate = defineOperation({
  name: "ticketPhase.importTemplate",
  kind: "command",
  description:
    "Import a ticket phase template as ordinary, editable phases with their flags and " +
    "transitions. Phases whose name already exists are skipped; the template's transitions " +
    "between phases with its names are added, existing transitions are kept. An existing entry " +
    "phase stays the entry phase.",
  input: TicketPhaseImportTemplateInputSchema,
  output: TicketPhaseImportTemplateOutputSchema,
  permission: "ticketPhase:admin",
  handler: ({ input, context }) =>
    importTicketPhases({ context, template: getTicketPhaseTemplate({ key: input.template }) }),
});
