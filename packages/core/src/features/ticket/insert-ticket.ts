import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { checkNewTicket } from "./check-new-ticket";
import { recordEstimate } from "./estimate-history";
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

type EntryInput = { context: OperationContext; statusId: string | undefined };

/**
 * The start status: the given one, else the organization's entry status. Creating a ticket is not
 * a move, so no transition gate applies (ADR 0067 §5).
 */
const loadStartStatus = async ({ context, statusId }: EntryInput): Promise<Result<string>> =>
  statusId ? ok({ value: statusId }) : await entryStatusId({ context });

type FirstHistoryInput = {
  context: OperationContext;
  ticketId: string;
  statusId: string;
  trigger: "MANUAL" | "TEMPLATE";
  estimatedValueMinor: number | null | undefined;
};

/**
 * The first entry of the status history (ADR 0054), which confirms the status the ticket was
 * inserted with, and its first estimate when one is given (ADR 0074).
 */
async function recordFirstHistory({ context, ticketId, statusId, ...rest }: FirstHistoryInput) {
  const first = { fromStatusId: null, toStatusId: statusId, trigger: rest.trigger } as const;
  await recordStatusChange({ context, ticketId, ...first });
  await recordEstimate({ context, ticketId, current: null, valueMinor: rest.estimatedValueMinor });
}

/**
 * The input stored as it is on the ticket row. The type, fields, assignee and estimate are written
 * on their own; the template is provenance (the trigger) and lines are the caller's (ADR 0081).
 */
function ownColumns({ input }: { input: TicketCreateInput }) {
  const { entityTypeId: _type, fields: _fields, assigneeId: _assignee, ...rest } = input;
  const { estimatedValueMinor: _estimate, templateId: _template, lines: _lines, ...data } = rest;
  return data;
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
  const { entityTypeId, assigneeId, estimatedValueMinor } = input;
  const data = ownColumns({ input });
  const statusId = await loadStartStatus({ context, statusId: startStatusId });
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
  const history = { statusId: statusId.value, trigger, estimatedValueMinor };
  await recordFirstHistory({ context, ticketId: row.id, ...history });
  const ticket = (await loadTicket({ context, id: row.id })) ?? toTicketDto({ row });
  context.recordChange({ entityId: row.id, after: ticket });
  await assignOnCreate({ context, subjectType: "TICKET", subjectId: row.id, assigneeId });
  return ok({ value: ticket });
}
