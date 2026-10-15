import type { Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkCustomer, checkOwners } from "./booking-rules";

export type CheckNewBookingInput = {
  context: Pick<OperationContext, "db">;
  entityTypeId: string;
  customerId: string;
  salesOwnerId?: string | null | undefined;
  coordinatorId?: string | null | undefined;
  fields?: Record<string, unknown> | undefined;
};

/**
 * The checks every new booking passes, alone (`booking.create`) or as an occurrence of a series
 * (`bookingSeries.create`): a `BOOKING` type, an active customer, owners who are members and
 * field values that match the type. Returns the validated field values.
 */
export async function checkNewBooking({
  context,
  entityTypeId,
  customerId,
  salesOwnerId,
  coordinatorId,
  fields,
}: CheckNewBookingInput): Promise<Result<Record<string, unknown>>> {
  const type = await loadTypeOfBase({ context, entityTypeId, base: "BOOKING" });
  if (!type.ok) return type;
  const customer = await checkCustomer({ context, customerId });
  if (!customer.ok) return customer;
  const owners = await checkOwners({ context, salesOwnerId, coordinatorId });
  if (!owners.ok) return owners;
  return validateFields({ context, entityTypeId, values: fields ?? {} });
}
