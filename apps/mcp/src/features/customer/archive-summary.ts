import { execute, getCustomer } from "@okazi/core";
import { type SummaryInput, text } from "../../tools/meta";

/**
 * Approval text of `customer.archive`. With `archiveBookings` it reads the customer as the
 * proposing user, so the card says how many bookings will be archived with it.
 */
export async function archiveCustomerSummary({ input, context }: SummaryInput): Promise<string> {
  const id = text({ value: input.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  if (!found.ok) return `Archive customer ${id}`;
  const { name, bookingCount } = found.value;
  if (input.archiveBookings !== true || bookingCount === 0) return `Archive customer "${name}"`;
  const bookings = bookingCount === 1 ? "1 booking" : `${bookingCount} bookings`;
  return `Archive customer "${name}" and its ${bookings}`;
}
