import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { customerKind } from "./deletion-kind";
import { customerEmbeddable } from "./embeddable";
import { getCustomer } from "./operations";
import { CustomerIdInputSchema } from "./schema";

export const restoreCustomer = defineRestoreOperation({
  name: "customer.restore",
  description:
    "Restore an archived customer: it is active again. Its orders and bundles archived with it " +
    "stay archived. CONFLICT when it is not archived or its type is archived.",
  permission: "customer:delete",
  kind: customerKind,
  input: CustomerIdInputSchema,
  get: getCustomer,
  embeddable: customerEmbeddable,
});

export const deleteCustomer = defineDeleteOperation({
  name: "customer.delete",
  description:
    "Delete an archived customer permanently (ADR 0118), with its contacts. An active customer " +
    "is CONFLICT: archive it first. CONFLICT while any order, task, bundle or price list of it " +
    "is left, archived or not.",
  permission: "customer:delete",
  kind: customerKind,
  input: CustomerIdInputSchema,
});
