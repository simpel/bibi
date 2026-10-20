import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { conflict } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { checkNewTicket } from "./check-new-ticket";
import { recordPhaseChange } from "./phase-history";
import type { TicketCreateInput, TicketDto } from "./schema";
import { entryPhaseId, nextReference } from "./ticket-defaults";
import { loadTicket, TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type InsertTicketInput = {
  context: OperationContext;
  input: TicketCreateInput;
  /** Start phase; the organization's entry phase when omitted (`ticket.createFromTemplate` sets it). */
  phaseId?: string;
  /** Recorded on the first phase history row (ADR 0054): `TEMPLATE` from a template, else `MANUAL`. */
  trigger?: "MANUAL" | "TEMPLATE";
};

type EntryInput = {
  context: OperationContext;
  assigneeId: string | null | undefined;
  phaseId: string | undefined;
};

/**
 * The start phase; when it requires an assignee (ADR 0043), the new ticket must get one. A new
 * ticket has no quote, so it cannot start in a phase that requires an accepted one (ADR 0054).
 */
async function loadStartPhase({
  context,
  assigneeId,
  phaseId,
}: EntryInput): Promise<Result<string>> {
  const start = phaseId ? ok({ value: phaseId }) : await entryPhaseId({ context });
  if (!start.ok) return start;
  const phase = await context.db.ticketPhase.findFirst({ where: { id: start.value } });
  if (phase?.requiresAcceptedQuote) {
    const message = `A new ticket cannot start in "${phase.name}": it requires an accepted quote`;
    return conflict({ message, issues: [{ path: "phaseId", message }] });
  }
  if (assigneeId || !phase?.requiresAssignee) return start;
  return conflict({
    message: `A ticket in "${phase.name}" requires an assignee`,
    issues: [{ path: "assigneeId", message: "Required by the entry phase" }],
  });
}

/**
 * Creates a ticket in the start phase (default: the organization's entry phase) with the next reference number and records
 * the change, with its main assignment when an assignee is given (ADR 0043).
 */
export async function insertTicket({
  context,
  input,
  phaseId: startPhaseId,
  trigger = "MANUAL",
}: InsertTicketInput): Promise<Result<TicketDto>> {
  const checked = await checkNewTicket({ context, input });
  if (!checked.ok) return checked;
  const { entityTypeId, fields: _fields, assigneeId, ...data } = input;
  const phaseId = await loadStartPhase({ context, assigneeId, phaseId: startPhaseId });
  if (!phaseId.ok) return phaseId;
  const reference = await nextReference({ context });
  const row = await createRecord({
    context,
    base: "TICKET",
    entityTypeId,
    fields: checked.value.fields,
    links: checked.value.links,
    insert: ({ id }) =>
      context.db.ticket.create({
        data: {
          id,
          ...data,
          entityTypeId,
          phaseId: phaseId.value,
          reference,
          fields: toJson({ value: checked.value.fields }) ?? {},
          organizationId: context.organizationId,
        },
        include: TICKET_INCLUDE,
      }),
  });
  // The first entry of the phase history (ADR 0054); it confirms the phase inserted above.
  const first = { fromPhaseId: null, toPhaseId: phaseId.value, trigger } as const;
  await recordPhaseChange({ context, ticketId: row.id, ...first });
  const ticket = (await loadTicket({ context, id: row.id })) ?? toTicketDto({ row });
  context.recordChange({ entityId: row.id, after: ticket });
  await assignOnCreate({ context, subjectType: "TICKET", subjectId: row.id, assigneeId });
  return ok({ value: ticket });
}
