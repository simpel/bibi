import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { checkNewTicket } from "./check-new-ticket";
import type { TicketCreateInput, TicketDto } from "./schema";
import { entryPhaseId, nextReference } from "./ticket-defaults";
import { toTicketDto } from "./to-ticket-dto";

export type InsertTicketInput = { context: OperationContext; input: TicketCreateInput };

type EntryInput = { context: OperationContext; assigneeId: string | null | undefined };

/** The entry phase; when it requires an assignee (ADR 0043), the new ticket must get one. */
async function loadEntryPhase({ context, assigneeId }: EntryInput): Promise<Result<string>> {
  const phaseId = await entryPhaseId({ context });
  if (!phaseId.ok || assigneeId) return phaseId;
  const phase = await context.db.ticketPhase.findFirst({ where: { id: phaseId.value } });
  if (!phase?.requiresAssignee) return phaseId;
  return conflict({
    message: `A ticket in "${phase.name}" requires an assignee`,
    issues: [{ path: "assigneeId", message: "Required by the entry phase" }],
  });
}

/**
 * Creates a ticket in the organization's entry phase with the next reference number and records
 * the change, with its main assignment when an assignee is given (ADR 0043).
 */
export async function insertTicket({
  context,
  input,
}: InsertTicketInput): Promise<Result<TicketDto>> {
  const checked = await checkNewTicket({ context, input });
  if (!checked.ok) return checked;
  const { entityTypeId, fields: _fields, assigneeId, ...data } = input;
  const phaseId = await loadEntryPhase({ context, assigneeId });
  if (!phaseId.ok) return phaseId;
  const row = await context.db.ticket.create({
    data: {
      ...data,
      entityTypeId,
      phaseId: phaseId.value,
      reference: await nextReference({ context }),
      fields: toJson({ value: checked.value }) ?? {},
      organizationId: context.organizationId,
    },
  });
  const ticket = toTicketDto({ row });
  context.recordChange({ entityId: row.id, after: ticket });
  await assignOnCreate({ context, subjectType: "TICKET", subjectId: row.id, assigneeId });
  return ok({ value: ticket });
}
