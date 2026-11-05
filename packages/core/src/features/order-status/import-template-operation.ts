import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import type { OrderStatusTemplate } from "../../templates/order-statuses/order-status-template";
import { getOrderStatusTemplate } from "../../templates/order-statuses/order-status-templates";
import { insertOrderStatus, orderStatusNameTaken } from "./insert-order-status";
import { loadOrderStatus } from "./load-order-status";
import { replaceGates } from "./replace-gates";
import {
  type OrderStatusDto,
  type OrderStatusImportResult,
  OrderStatusImportTemplateInputSchema,
  OrderStatusImportTemplateOutputSchema,
} from "./schema";

type TemplateInput = { context: OperationContext; template: OrderStatusTemplate };

type AddGatesInput = {
  context: OperationContext;
  template: OrderStatusTemplate;
  created: OrderStatusDto[];
};

/**
 * Sets the template's gates on moves into the statuses this import created, from any status
 * (ADR 0076); statuses that existed before keep theirs. Audited on each gated status.
 */
async function addGates({ context, template, created }: AddGatesInput) {
  let count = 0;
  const statuses: OrderStatusDto[] = [];
  for (const status of created) {
    const gatesIn = template.statuses.find(({ name }) => name === status.name)?.gatesIn ?? [];
    if (gatesIn.length === 0) {
      statuses.push(status);
      continue;
    }
    const gates = [{ fromStatusId: null, gates: [...gatesIn] }];
    await replaceGates({ context, toStatusId: status.id, gates });
    const after = await loadOrderStatus({ context, id: status.id });
    if (after) context.recordChange({ entityId: status.id, before: status, after });
    statuses.push(after ?? status);
    count += gatesIn.length;
  }
  return { count, statuses };
}

/** The quote events an active status already has; the import never takes one from it. */
async function eventsInUse({ context }: { context: OperationContext }) {
  const rows = await context.db.orderStatus.findMany({ where: { event: { not: null } } });
  return new Set(rows.flatMap((row) => (row.event ? [row.event] : [])));
}

/**
 * Shared by `orderStatus.importTemplate` and organization provisioning. An organization that
 * already has an entry status or a quote event status keeps it: the template's flag is then dropped.
 */
export async function importOrderStatuses({
  context,
  template,
}: TemplateInput): Promise<Result<OrderStatusImportResult>> {
  const created = [];
  const skipped: string[] = [];
  const hasEntry = (await context.db.orderStatus.count({ where: { entry: true } })) > 0;
  const takenEvents = await eventsInUse({ context });
  for (const orderStatus of template.statuses) {
    if (await orderStatusNameTaken({ context, name: orderStatus.name })) {
      skipped.push(orderStatus.name);
      continue;
    }
    const entry = orderStatus.entry === true && !hasEntry;
    const event =
      orderStatus.event && !takenEvents.has(orderStatus.event) ? orderStatus.event : null;
    const { gatesIn: _gatesIn, ...fields } = orderStatus;
    const inserted = await insertOrderStatus({ context, ...fields, entry, event, ownPhase: true });
    if (!inserted.ok) return inserted;
    created.push(inserted.value);
  }
  const added = await addGates({ context, template, created });
  return ok({ value: { created: added.statuses, skipped, gatesAdded: added.count } });
}

export const importOrderStatusTemplate = defineOperation({
  name: "orderStatus.importTemplate",
  kind: "command",
  description:
    "Import an order status template as ordinary, editable statuses with their flags and " +
    "free movement and the template's gates on moves into a status. Statuses whose name already " +
    "exists are skipped and keep their moves and gates. An existing entry " +
    "status stays the entry status, and a quote event that a status has stays with it.",
  input: OrderStatusImportTemplateInputSchema,
  output: OrderStatusImportTemplateOutputSchema,
  permission: "pipeline:write",
  handler: ({ input, context }) =>
    importOrderStatuses({ context, template: getOrderStatusTemplate({ key: input.template }) }),
});
