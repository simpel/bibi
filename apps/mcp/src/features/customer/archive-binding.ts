import { execute, getCustomer, ok, type Result } from "@bibi/core";
import { type SummaryInput, text } from "../../tools/meta";

/**
 * Binds the order count to a `customer.archive` proposal (#144). With `archiveOrders` the
 * server reads the customer as the proposing user and signs `expectedOrderCount` = its current
 * number of orders that are not archived; whatever the assistant sent is replaced. Confirm is
 * then refused with CONFLICT if the count changed. If the customer cannot be read the proposal
 * is refused. Without `archiveOrders` no count is signed.
 */
export async function bindArchiveCustomer({
  input,
  context,
}: SummaryInput): Promise<Result<Record<string, unknown>>> {
  const { expectedOrderCount: _sent, ...rest } = input;
  if (rest.archiveOrders !== true) return ok({ value: rest });
  const id = text({ value: rest.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  if (!found.ok) return found;
  // Null when the caller may not view orders; the archive then refuses the cascade anyway.
  const count = found.value.orderCount;
  return ok({ value: { ...rest, ...(count === null ? {} : { expectedOrderCount: count }) } });
}
