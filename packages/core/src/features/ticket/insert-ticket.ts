import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { conflict } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { checkNewTicket } from "./check-new-ticket";
import type { TicketCreateInput, TicketDto } from "./schema";
import { recordStatusChange } from "./status-history";
import { entryStatusId, nextReference } from "./ticket-defaults";
import { loadTicket, TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type InsertTicketInput = {
  context: OperationContext;
  input: TicketCreateInput;
  /** Start status; the organization's entry status when omitted (`ticket.createFromTemplate` sets it). */
  statusId?: string;
  /** Recorded on the first status history row (ADR 0054): `TEMPLATE` from a template, else `MANUAL`. */
  trigger?: "MANUAL" | "TEMPLATE";
};

type EntryInput = {
  context: OperationContext;
  assigneeId: string | null | undefined;
  statusId: string | undefined;
};

/**
 * The start status; when it requires an assignee (ADR 0043), the new ticket must get one. A new
 * ticket has no quote, so it cannot start in a status that requires an accepted one (ADR 0054).
 */
async function loadStartStatus({
  context,
  assigneeId,
  statusId,
}: EntryInput): Promise<Result<string>> {
  const start = statusId ? ok({ value: statusId }) : await entryStatusId({ context });
  if (!start.ok) return start;
  const ticketStatus = await context.db.ticketStatus.findFirst({ where: { id: start.value } });
  if (ticketStatus?.requiresAcceptedQuote) {
    const message = `A new ticket cannot start in "${ticketStatus.name}": it requires an accepted quote`;
    return conflict({ message, issues: [{ path: "statusId", message }] });
  }
  if (assigneeId || !ticketStatus?.requiresAssignee) return start;
  return conflict({
    message: `A ticket in "${ticketStatus.name}" requires an assignee`,
    issues: [{ path: "assigneeId", message: "Required by the entry status" }],
  });
}

/**
 * Creates a ticket in the start status (default: the organization's entry status) with the next reference number and records
 * the change, with its main assignment when an assignee is given (ADR 0043).
 */
export async function insertTicket({
  context,
  input,
  statusId: startStatusId,
  trigger = "MANUAL",
}: InsertTicketInput): Promise<Result<TicketDto>> {
  const checked = await checkNewTicket({ context, input });
  if (!checked.ok) return checked;
  const { entityTypeId, fields: _fields, assigneeId, ...data } = input;
  const statusId = await loadStartStatus({ context, assigneeId, statusId: startStatusId });
  if (!statusId.ok) return statusId;
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
          statusId: statusId.value,
          reference,
          fields: toJson({ value: checked.value.fields }) ?? {},
          organizationId: context.organizationId,
        },
        include: TICKET_INCLUDE,
      }),
  });
  // The first entry of the status history (ADR 0054); it confirms the status inserted above.
  const first = { fromStatusId: null, toStatusId: statusId.value, trigger } as const;
  await recordStatusChange({ context, ticketId: row.id, ...first });
  const ticket = (await loadTicket({ context, id: row.id })) ?? toTicketDto({ row });
  context.recordChange({ entityId: row.id, after: ticket });
  await assignOnCreate({ context, subjectType: "TICKET", subjectId: row.id, assigneeId });
  return ok({ value: ticket });
}
