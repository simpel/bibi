import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { orderTemplateKind } from "./deletion-kind";
import { getOrderTemplate } from "./operations";
import { OrderTemplateIdInputSchema } from "./schema";

export const restoreOrderTemplate = defineRestoreOperation({
  name: "orderTemplate.restore",
  description:
    "Restore an archived package: it is active again. CONFLICT when it is not archived, its " +
    "type or start status is archived, or an active package has its name.",
  permission: "orderTemplate:delete",
  kind: orderTemplateKind,
  input: OrderTemplateIdInputSchema,
  get: getOrderTemplate,
});

export const deleteOrderTemplate = defineDeleteOperation({
  name: "orderTemplate.delete",
  description:
    "Delete an archived package permanently (ADR 0118), with its lines. An active package is " +
    "CONFLICT: archive it first. CONFLICT while an inbox address offers it.",
  permission: "orderTemplate:delete",
  kind: orderTemplateKind,
  input: OrderTemplateIdInputSchema,
});
