import { execute, getCustomer, ok, type Result } from "@okazi/core";
import { type SummaryInput, text } from "../../tools/meta";

/**
 * Binds the booking count to a `customer.archive` proposal (#144). With `archiveBookings` the
 * server reads the customer as the proposing user and signs `expectedBookingCount` = its current
 * number of bookings that are not archived; whatever the assistant sent is replaced. Confirm is
 * then refused with CONFLICT if the count changed. If the customer cannot be read the proposal
 * is refused. Without `archiveBookings` no count is signed.
 */
export async function bindArchiveCustomer({
  input,
  context,
}: SummaryInput): Promise<Result<Record<string, unknown>>> {
  const { expectedBookingCount: _sent, ...rest } = input;
  if (rest.archiveBookings !== true) return ok({ value: rest });
  const id = text({ value: rest.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  if (!found.ok) return found;
  return ok({ value: { ...rest, expectedBookingCount: found.value.bookingCount } });
}
