import {
  archiveOrderTemplate,
  createOrderTemplate,
  getOrderTemplate,
  listOrderTemplates,
  type OrderTemplateDto,
  OrderTemplateSchema,
  updateOrderTemplate,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const OrderTemplateRef = objectFromSchema<OrderTemplateDto>({
  name: "OrderTemplate",
  schema: OrderTemplateSchema,
  omit: ["organizationId"],
  description:
    "Order template – a predefined order: order type, start status, default field values and " +
    "lines (item, setup, offset and duration from the order start, quantity).",
});
const OrderTemplatePageRef = pageType({ name: "OrderTemplatePage", item: OrderTemplateRef });

fieldFromOperation({
  operation: listOrderTemplates,
  type: OrderTemplatePageRef,
  name: "orderTemplates",
});
fieldFromOperation({
  operation: getOrderTemplate,
  type: OrderTemplateRef,
  name: "orderTemplate",
});
mutationFromOperation({ operation: createOrderTemplate, type: OrderTemplateRef });
mutationFromOperation({ operation: updateOrderTemplate, type: OrderTemplateRef });
mutationFromOperation({ operation: archiveOrderTemplate, type: OrderTemplateRef });
