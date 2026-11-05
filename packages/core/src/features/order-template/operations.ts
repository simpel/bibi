import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { archiveRecords } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { checkTemplate } from "./check-template";
import { loadOrderTemplate, toOrderTemplateDto, WITH_LINES } from "./load-order-template";
import { replaceLines } from "./replace-lines";
import {
  OrderTemplateCreateInputSchema,
  OrderTemplateIdInputSchema,
  OrderTemplateListInputSchema,
  OrderTemplateListOutputSchema,
  OrderTemplateSchema,
  OrderTemplateUpdateInputSchema,
} from "./schema";
import { nameTaken } from "./template-name";
import { insertTemplateRow, updateTemplateRow } from "./template-rows";

export const listOrderTemplates = defineOperation({
  name: "orderTemplate.list",
  kind: "query",
  description:
    "List the organization's predefined orders (templates), ordered by name, each with its " +
    "order type, start status, default field values and lines. Make an order from one with " +
    "order.createFromTemplate.",
  input: OrderTemplateListInputSchema,
  output: OrderTemplateListOutputSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.orderTemplate.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: WITH_LINES,
      ...pageArgs(input),
    });
    const templates = rows.map((row) => toOrderTemplateDto({ row }));
    return ok({ value: paginate({ rows: templates, limit: input.limit }) });
  },
});

export const getOrderTemplate = defineOperation({
  name: "orderTemplate.get",
  kind: "query",
  description: "Get one predefined order (template) by id, with its lines.",
  input: OrderTemplateIdInputSchema,
  output: OrderTemplateSchema,
  permission: "template:read",
  handler: async ({ input, context }) => {
    const template = await loadOrderTemplate({ context, id: input.id });
    return template ? ok({ value: template }) : notFound({ entity: "Order template" });
  },
});

const LINE_NOTE =
  "Each line is a line the order gets: a line type, a name, an optional " +
  "general item and setup, minutes from the order's start and a duration, and a quantity " +
  "(empty: the line counts the order's headcount).";

export const createOrderTemplate = defineOperation({
  name: "orderTemplate.create",
  kind: "command",
  description:
    "Create a predefined order (a package in the UI): a name, an order type, the (non-closing) " +
    "status orders start in, an optional guest range (minGuests, maxGuests), default own-field " +
    `values and lines. ${LINE_NOTE}`,
  input: OrderTemplateCreateInputSchema,
  output: OrderTemplateSchema,
  permission: "template:write",
  handler: async ({ input, context }) => {
    const { lines, fields: _fields, ...data } = input;
    const taken = await nameTaken({ context, name: data.name });
    if (taken) return taken;
    const checked = await checkTemplate({ context, ...input });
    if (!checked.ok) return checked;
    const row = await insertTemplateRow({ context, data, fields: checked.value });
    await replaceLines({ context, templateId: row.id, lines });
    const after = await loadOrderTemplate({ context, id: row.id });
    if (!after) return notFound({ entity: "Order template" });
    context.recordChange({ entityId: row.id, after });
    return ok({ value: after });
  },
});

export const updateOrderTemplate = defineOperation({
  name: "orderTemplate.update",
  kind: "command",
  description:
    "Change a predefined order. Omitted properties are unchanged; `fields` and `lines` replace " +
    `the whole set when given. Orders already made from it are not changed. ${LINE_NOTE}`,
  input: OrderTemplateUpdateInputSchema,
  output: OrderTemplateSchema,
  permission: "template:write",
  handler: async ({ input: { id, lines, fields, ...data }, context }) => {
    const before = await loadOrderTemplate({ context, id });
    if (!before) return notFound({ entity: "Order template" });
    const taken = data.name ? await nameTaken({ context, name: data.name, id }) : null;
    if (taken) return taken;
    const checked = await checkTemplate({
      context,
      entityTypeId: data.entityTypeId ?? before.entityTypeId,
      statusId: data.statusId ?? before.statusId,
      fields: fields ?? before.fields,
      minGuests: data.minGuests === undefined ? before.minGuests : data.minGuests,
      maxGuests: data.maxGuests === undefined ? before.maxGuests : data.maxGuests,
      lines: lines ?? before.lines,
    });
    if (!checked.ok) return checked;
    const values = fields ? checked.value : undefined;
    await updateTemplateRow({ context, id, data, fields: values });
    if (lines) await replaceLines({ context, templateId: id, lines });
    const after = await loadOrderTemplate({ context, id });
    if (!after) return notFound({ entity: "Order template" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveOrderTemplate = defineOperation({
  name: "orderTemplate.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a predefined order. Orders already made from it are not changed.",
  input: OrderTemplateIdInputSchema,
  output: OrderTemplateSchema,
  permission: "template:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await loadOrderTemplate({ context, id });
    if (!before) return notFound({ entity: "Order template" });
    await context.db.orderTemplate.update({ where: { id }, data: { status: "ARCHIVED" } });
    await archiveRecords({ context, ids: [id] });
    const after = { ...before, status: "ARCHIVED" as const };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

/** Every predefined-order operation (ADR 0043); implementations live in the sibling files. */
export const orderTemplateOperations = [
  listOrderTemplates,
  getOrderTemplate,
  createOrderTemplate,
  updateOrderTemplate,
  archiveOrderTemplate,
];
