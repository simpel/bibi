import {
  archiveOrderStatus,
  createOrderStatus,
  getOrderStatus,
  importOrderStatusTemplate,
  listOrderStatuses,
  type OrderStatusDto,
  type OrderStatusImportResult,
  OrderStatusSchema,
  previewArchiveOrderStatus,
  reorderOrderStatuses,
  setOrderStatusGates,
  setOrderStatusTransitions,
  updateOrderStatus,
} from "@bibi/core";
import { ArchivePreviewRef } from "../../schema/archive-preview";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const OrderStatusRef = objectFromSchema<OrderStatusDto>({
  name: "OrderStatus",
  schema: OrderStatusSchema,
  omit: ["organizationId"],
  description:
    "Order status – one of the organization's own statuses, with its flags (entry, closing, " +
    "invoiceable). `transitionsTo` lists the statuses an order may move to (every other one unless `restrictsNext`) and " +
    "`transitionGates` the gates on those moves (ADR 0067).",
});
const OrderStatusPageRef = pageType({ name: "OrderStatusPage", item: OrderStatusRef });

const OrderStatusImportRef = builder
  .objectRef<OrderStatusImportResult>("OrderStatusImport")
  .implement({
    description: "Result of importing an order status template.",
    fields: (t) => ({
      created: t.field({ type: [OrderStatusRef], resolve: (result) => result.created }),
      skipped: t.stringList({
        description: "Names that already existed",
        resolve: (result) => result.skipped,
      }),
      gatesAdded: t.int({ resolve: (result) => result.gatesAdded }),
    }),
  });

fieldFromOperation({
  operation: listOrderStatuses,
  type: OrderStatusPageRef,
  name: "orderStatuses",
});
fieldFromOperation({ operation: getOrderStatus, type: OrderStatusRef, name: "orderStatus" });
mutationFromOperation({ operation: createOrderStatus, type: OrderStatusRef });
mutationFromOperation({ operation: updateOrderStatus, type: OrderStatusRef });
mutationFromOperation({ operation: archiveOrderStatus, type: OrderStatusRef });
fieldFromOperation({
  operation: previewArchiveOrderStatus,
  type: ArchivePreviewRef,
  name: "orderStatusArchivePreview",
});
mutationFromOperation({ operation: reorderOrderStatuses, type: OrderStatusPageRef });
mutationFromOperation({ operation: setOrderStatusTransitions, type: OrderStatusRef });
mutationFromOperation({ operation: setOrderStatusGates, type: OrderStatusRef });
mutationFromOperation({ operation: importOrderStatusTemplate, type: OrderStatusImportRef });
