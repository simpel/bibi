import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { insertTicket } from "./insert-ticket";
import { TicketCreateInputSchema, TicketSchema, TicketUpdateInputSchema } from "./schema";
import { loadTicket, TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";
import { checkTicketDetails } from "./update-rules";

export const createTicket = defineOperation({
  name: "ticket.create",
  kind: "command",
  description:
    "Create a ticket of one of the organization's ticket types for a customer (ADR 0043). It " +
    "gets the next reference number and starts in the organization's entry status. Nothing but " +
    "the type and customer is required; the contact must work at the customer. `assigneeId` (a " +
    "member) becomes the main assignee. `fields` must match the type's own fields.",
  input: TicketCreateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input, context }) => insertTicket({ context, input }),
});

export const updateTicket = defineOperation({
  name: "ticket.update",
  kind: "command",
  description:
    "Update a ticket's customer, contact, desired period, headcount, budget, " +
    "holdsUntil (when its soft holds expire) or own " +
    "fields. Omitted properties are unchanged; `fields` is merged by key (null clears a value). " +
    "The type cannot be changed, the status changes only with ticket.changeStatus and the " +
    "assignee with assignment.assign.",
  input: TicketUpdateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
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
