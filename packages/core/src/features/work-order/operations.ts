import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { buildWorkOrderContent } from "./build-content";
import { checkSourcesReadable } from "./check-sources-readable";
import { loadWorkOrderPage } from "./list-page";
import { WorkOrderListInputSchema, WorkOrderListOutputSchema } from "./list-schema";
import { loadMatches } from "./load-matches";
import { loadSources } from "./load-sources";
import { WorkOrderGenerateInputSchema, WorkOrderIdInputSchema, WorkOrderSchema } from "./schema";
import { sendWorkOrder } from "./send-operation";
import { toWorkOrderDto, WORK_ORDER_INCLUDE } from "./to-work-order-dto";
import { createVersion, findVersions, sameAsLatest } from "./versions";

export const listWorkOrders = defineOperation({
  name: "workOrder.list",
  kind: "query",
  description:
    "List generated work order versions (e.g. kitchen orders), newest first: version, whether it " +
    "is the current one, receiving responsibility, the rows of the snapshot, the changes marked ★ " +
    "since the last sent version and when it was sent. Filter by ticket, work order definition " +
    "or a window over the ticket's period (`from`/`to`); search with `q` (`involves:me " +
    "is:current` = my current work orders) and order with `sort`/`direction`. Page with " +
    "`cursor`, or with `page` to get numbered pages and the `total` count.",
  input: WorkOrderListInputSchema,
  output: WorkOrderListOutputSchema,
  permission: "workOrder:read",
  handler: async ({ input, context }) => ok({ value: await loadWorkOrderPage({ input, context }) }),
});

export const getWorkOrder = defineOperation({
  name: "workOrder.get",
  kind: "query",
  description: "Get one work order version by id, with its rows and the changes marked ★.",
  input: WorkOrderIdInputSchema,
  output: WorkOrderSchema,
  permission: "workOrder:read",
  handler: async ({ input, context }) => {
    const row = await context.db.workOrder.findFirst({
      where: { id: input.id },
      include: WORK_ORDER_INCLUDE,
    });
    return row ? ok({ value: toWorkOrderDto({ row }) }) : notFound({ entity: "WorkOrder" });
  },
});

export const generateWorkOrder = defineOperation({
  name: "workOrder.generate",
  kind: "command",
  description:
    "Generate the work order of a ticket from a work order definition (e.g. the kitchen order): a " +
    "snapshot of the ticket's items and counts that the definition includes. A changed " +
    "ticket gives the next version, with the changed rows marked ★ against the last SENT " +
    "version; an unchanged ticket returns the latest version. Sending is a separate step " +
    "(workOrder.send). Needs ticket:read, program:read and item:read (the rows are copied from them).",
  input: WorkOrderGenerateInputSchema,
  output: WorkOrderSchema,
  permission: "workOrder:write",
  handler: async ({ input: { ticketId, workOrderDefinitionId }, context }) => {
    const readable = checkSourcesReadable({ context });
    if (!readable.ok) return readable;
    const sources = await loadSources({ context, ticketId, workOrderDefinitionId });
    if (!sources.ok) return sources;
    const { ticket, definition } = sources.value;
    const { latest, sent } = await findVersions({ context, ticketId, workOrderDefinitionId });
    const content = await buildWorkOrderContent({ context, ticket, definition });
    const matches = await loadMatches({ context, ticketId, definition });
    if (latest && sameAsLatest({ latest, content, matches, definition })) {
      return ok({ value: toWorkOrderDto({ row: latest }) });
    }
    const row = await createVersion({
      context,
      ticket,
      definition,
      content,
      matches,
      latest,
      sent,
    });
    const workOrder = toWorkOrderDto({ row });
    context.recordChange({ entityId: row.id, after: workOrder });
    return ok({ value: workOrder });
  },
});

export { sendWorkOrder };

export const workOrderOperations = [listWorkOrders, getWorkOrder, generateWorkOrder, sendWorkOrder];
