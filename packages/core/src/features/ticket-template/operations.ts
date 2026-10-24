import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveRecords } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { checkTemplate } from "./check-template";
import { loadTicketTemplate, toTicketTemplateDto, WITH_LINES } from "./load-ticket-template";
import { replaceLines } from "./replace-lines";
import {
  TicketTemplateCreateInputSchema,
  TicketTemplateIdInputSchema,
  TicketTemplateListInputSchema,
  TicketTemplateListOutputSchema,
  TicketTemplateSchema,
  TicketTemplateUpdateInputSchema,
} from "./schema";
import { nameTaken } from "./template-name";
import { insertTemplateRow, updateTemplateRow } from "./template-rows";

export const listTicketTemplates = defineOperation({
  name: "ticketTemplate.list",
  kind: "query",
  description:
    "List the organization's predefined tickets (templates), ordered by name, each with its " +
    "ticket type, start status, default field values and lines. Make a ticket from one with " +
    "ticket.createFromTemplate.",
  input: TicketTemplateListInputSchema,
  output: TicketTemplateListOutputSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.ticketTemplate.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: WITH_LINES,
      ...pageArgs(input),
    });
    const templates = rows.map((row) => toTicketTemplateDto({ row }));
    return ok({ value: paginate({ rows: templates, limit: input.limit }) });
  },
});

export const getTicketTemplate = defineOperation({
  name: "ticketTemplate.get",
  kind: "query",
  description: "Get one predefined ticket (template) by id, with its lines.",
  input: TicketTemplateIdInputSchema,
  output: TicketTemplateSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const template = await loadTicketTemplate({ context, id: input.id });
    return template ? ok({ value: template }) : notFound({ entity: "Ticket template" });
  },
});

const LINE_NOTE =
  "Each line is a line the ticket gets: a line type, a name, an optional " +
  "general item and setup, minutes from the ticket's start and a duration, and a quantity " +
  "(empty: the line counts the ticket's headcount).";

export const createTicketTemplate = defineOperation({
  name: "ticketTemplate.create",
  kind: "command",
  description:
    "Create a predefined ticket: a name, a ticket type, the (non-closing) status tickets start " +
    `in, default own-field values and lines. ${LINE_NOTE}`,
  input: TicketTemplateCreateInputSchema,
  output: TicketTemplateSchema,
  permission: "template:write",
  handler: async ({ input, context }) => {
    const { lines, fields: _fields, ...data } = input;
    const taken = await nameTaken({ context, name: data.name });
    if (taken) return taken;
    const checked = await checkTemplate({ context, ...input });
    if (!checked.ok) return checked;
    const row = await insertTemplateRow({ context, data, fields: checked.value });
    await replaceLines({ context, templateId: row.id, lines });
    const after = await loadTicketTemplate({ context, id: row.id });
    if (!after) return notFound({ entity: "Ticket template" });
    context.recordChange({ entityId: row.id, after });
    return ok({ value: after });
  },
});

export const updateTicketTemplate = defineOperation({
  name: "ticketTemplate.update",
  kind: "command",
  description:
    "Change a predefined ticket. Omitted properties are unchanged; `fields` and `lines` replace " +
    `the whole set when given. Tickets already made from it are not changed. ${LINE_NOTE}`,
  input: TicketTemplateUpdateInputSchema,
  output: TicketTemplateSchema,
  permission: "template:write",
  handler: async ({ input: { id, lines, fields, ...data }, context }) => {
    const before = await loadTicketTemplate({ context, id });
    if (!before) return notFound({ entity: "Ticket template" });
    const taken = data.name ? await nameTaken({ context, name: data.name, id }) : null;
    if (taken) return taken;
    const checked = await checkTemplate({
      context,
      entityTypeId: data.entityTypeId ?? before.entityTypeId,
      statusId: data.statusId ?? before.statusId,
      fields: fields ?? before.fields,
      lines: lines ?? before.lines,
    });
    if (!checked.ok) return checked;
    const values = fields ? checked.value : undefined;
    await updateTemplateRow({ context, id, data, fields: values });
    if (lines) await replaceLines({ context, templateId: id, lines });
    const after = await loadTicketTemplate({ context, id });
    if (!after) return notFound({ entity: "Ticket template" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveTicketTemplate = defineOperation({
  name: "ticketTemplate.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a predefined ticket. Tickets already made from it are not changed.",
  input: TicketTemplateIdInputSchema,
  output: TicketTemplateSchema,
  permission: "template:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await loadTicketTemplate({ context, id });
    if (!before) return notFound({ entity: "Ticket template" });
    await context.db.ticketTemplate.update({ where: { id }, data: { status: "ARCHIVED" } });
    await archiveRecords({ context, ids: [id] });
    const after = { ...before, status: "ARCHIVED" as const };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

/** Every predefined-ticket operation (ADR 0043); implementations live in the sibling files. */
export const ticketTemplateOperations = [
  listTicketTemplates,
  getTicketTemplate,
  createTicketTemplate,
  updateTicketTemplate,
  archiveTicketTemplate,
];
