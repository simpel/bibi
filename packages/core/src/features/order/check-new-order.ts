import type { Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import type { CheckedFields } from "../field-definition/split-links";
import { checkContact, checkCustomer, checkDesiredPeriod, checkReadable } from "./order-rules";
import type { OrderCreateInput } from "./schema";

export type CheckNewOrderInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: OrderCreateInput;
};

/**
 * The checks every new order passes (`order.create`): a `ORDER` type, an active customer and
 * a contact at that customer the caller may read (both required, ADR 0081), a desired period
 * that ends after it starts, an assignee who is a member and field values that match the type.
 * Returns the field values.
 */
export async function checkNewOrder({
  context,
  input,
}: CheckNewOrderInput): Promise<Result<CheckedFields>> {
  const { entityTypeId, customerId, assigneeId } = input;
  for (const check of [
    checkDesiredPeriod(input),
    checkReadable({ context, permission: "customer:read", path: "customerId" }),
    checkReadable({ context, permission: "customer:read", path: "contactId" }),
    await loadTypeOfBase({ context, entityTypeId, base: "ORDER" }),
    await checkCustomer({ context, customerId }),
    await checkContact({ context, contactId: input.contactId, customerId }),
    await checkNewAssignee({ context, assigneeId }),
  ]) {
    if (!check.ok) return check;
  }
  return validateFields({ context, entityTypeId, values: input.fields ?? {} });
}
