import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { runTicketCreate } from "./create-ticket";
import { recordEstimate } from "./estimate-history";
import { TicketCreateInputSchema, TicketSchema, TicketUpdateInputSchema } from "./schema";
import { titleAfterCreate } from "./title/generate-title";
import { loadTicket, TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";
import { checkTicketDetails } from "./update-rules";

export const createTicket = defineOperation({
  name: "ticket.create",
  kind: "command",
  description:
    "Create a ticket of one of the organization's ticket types for a customer (ADR 0043), with " +
    "its lines in one step (ADR 0081): all of it is created, or nothing. It gets the next " +
    "reference number and starts in the organization's entry status, and each line in the " +
    "state the status grid gives its item type there. Nothing but the type, the customer and a " +
    "contact who works at the customer is required. `note` holds notes for the whole booking. " +
    "`assigneeId` (a member) becomes the main assignee. `fields` must match the type's own " +
    "fields. `lines` carry their chosen options and needs; a line whose hard start state would " +
    "clash is refused with CONFLICT at lines.<index> naming the blocking ticket, while a soft " +
    "overlap is prebooked. `templateId` records the package the lines came from, and " +
    "`inboundMessageId` attaches the inbox message the ticket is made from. Repeating a " +
    "call with the same `intakeKey` returns the first ticket and creates nothing. Without a " +
    "`title` one is generated from the ticket after it is created (null when none could be).",
  input: TicketCreateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input, context }) => runTicketCreate({ context, input }),
  external: titleAfterCreate,
  externalOptional: true,
});

export const updateTicket = defineOperation({
  name: "ticket.update",
  kind: "command",
  description:
    "Update a ticket's title, customer, contact, desired period, headcount, budget, estimated value " +
    "(each change is kept: ticket.estimateHistory), " +
    "holdsUntil (when its soft holds expire), the booking note or own " +
    "fields. The contact can be changed but never cleared. Omitted properties are unchanged; " +
    "`fields` is merged by key (null clears a value). " +
    "The type cannot be changed, the status changes only with ticket.changeStatus and the " +
    "assignee with assignment.assign.",
  input: TicketUpdateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input: { id, fields: patch, estimatedValueMinor, ...data }, context }) => {
    const before = await loadTicket({ context, id });
    if (!before) return notFound({ entity: "Ticket" });
    const details = await checkTicketDetails({ context, before, change: data });
    if (!details.ok) return details;
    let json: ReturnType<typeof toJson>;
    let links: LinkValue[] | undefined;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value.fields });
      links = checked.value.links;
    }
    await updateRecord({ context, id, change: { fields: json, links } });
    const current = before.estimatedValueMinor;
    await recordEstimate({ context, ticketId: id, current, valueMinor: estimatedValueMinor });
    const row = await context.db.ticket.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
      include: TICKET_INCLUDE,
    });
    const ticket = toTicketDto({ row });
    context.recordChange({ entityId: id, before, after: ticket });
    return ok({ value: ticket });
  },
});
