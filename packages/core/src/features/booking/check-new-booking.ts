import type { Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkCustomer } from "./booking-rules";

export type CheckNewBookingInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  entityTypeId: string;
  customerId: string;
  assigneeId?: string | null | undefined;
  fields?: Record<string, unknown> | undefined;
};

/**
 * The checks every new booking passes (`booking.create`): a `BOOKING` type, an active customer, an assignee who is a member and
 * field values that match the type. Returns the validated field values.
 */
export async function checkNewBooking({
  context,
  entityTypeId,
  customerId,
  assigneeId,
  fields,
}: CheckNewBookingInput): Promise<Result<Record<string, unknown>>> {
  const type = await loadTypeOfBase({ context, entityTypeId, base: "BOOKING" });
  if (!type.ok) return type;
  const customer = await checkCustomer({ context, customerId });
  if (!customer.ok) return customer;
  const owners = await checkNewAssignee({ context, assigneeId });
  if (!owners.ok) return owners;
  return validateFields({ context, entityTypeId, values: fields ?? {} });
}
