import { execute, getCustomer, ok, type Result } from "@okazi/core";
import { type SummaryInput, text } from "../../tools/meta";

/**
 * Binds the ticket count to a `customer.archive` proposal (#144). With `archiveTickets` the
 * server reads the customer as the proposing user and signs `expectedTicketCount` = its current
 * number of tickets that are not archived; whatever the assistant sent is replaced. Confirm is
 * then refused with CONFLICT if the count changed. If the customer cannot be read the proposal
 * is refused. Without `archiveTickets` no count is signed.
 */
export async function bindArchiveCustomer({
  input,
  context,
}: SummaryInput): Promise<Result<Record<string, unknown>>> {
  const { expectedTicketCount: _sent, ...rest } = input;
  if (rest.archiveTickets !== true) return ok({ value: rest });
  const id = text({ value: rest.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  if (!found.ok) return found;
  // Null when the caller may not view tickets; the archive then refuses the cascade anyway.
  const count = found.value.ticketCount;
  return ok({ value: { ...rest, ...(count === null ? {} : { expectedTicketCount: count }) } });
}
