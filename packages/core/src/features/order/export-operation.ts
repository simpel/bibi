import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { OrderExportInputSchema, OrderExportOutputSchema } from "./export-schema";
import { loadOrder } from "./to-order-dto";

/** Version of the exported document; bumped on every breaking change (ADR 0024). */
export const ORDER_EXPORT_SCHEMA_VERSION = 1;

export const exportOrder = defineOperation({
  name: "order.export",
  kind: "query",
  description:
    "Export an order for handover outside the system (ADR 0024) as a versioned json document: " +
    "the order with its own field values and its status. Returns the file name, media type " +
    "and content.",
  input: OrderExportInputSchema,
  output: OrderExportOutputSchema,
  permission: "order:write",
  handler: async ({ input, context }) => {
    const order = await loadOrder({ context, id: input.id });
    if (!order) return notFound({ entity: "Order" });
    const orderStatus = await context.db.orderStatus.findFirstOrThrow({
      where: { id: order.statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { id: true, name: true, closes: true },
    });
    const { inboundAddress: _address, ...exported } = order;
    const document = {
      schemaVersion: ORDER_EXPORT_SCHEMA_VERSION,
      order: exported,
      orderStatus,
    };
    const content = JSON.stringify(document, null, 2);
    return ok({
      value: {
        filename: `order-${order.reference}.json`,
        mime: "application/json",
        size: Buffer.byteLength(content),
        content,
      },
    });
  },
});
