import { execute, getCustomer } from "@bibi/core";
import { type SummaryInput, text } from "../../tools/meta";

const ordersText = ({ count }: { count: unknown }) => {
  if (typeof count !== "number") return " and all of its orders";
  if (count === 0) return "";
  return count === 1 ? " and its 1 order" : ` and its ${count} orders`;
};

/**
 * Approval text of `customer.archive`. The order count is the one signed into the input
 * (`expectedOrderCount`, bound by `bindArchiveCustomer`), never a fresh read, so the card
 * states exactly what confirm will archive (#144). The customer is read only for its name.
 */
export async function archiveCustomerSummary({ input, context }: SummaryInput): Promise<string> {
  const id = text({ value: input.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  const name = found.ok ? `"${found.value.name}"` : id;
  if (input.archiveOrders !== true) return `Archive customer ${name}`;
  return `Archive customer ${name}${ordersText({ count: input.expectedOrderCount })}`;
}
