import { execute, getCustomer } from "@okazi/core";
import { type SummaryInput, text } from "../../tools/meta";

const ticketsText = ({ count }: { count: unknown }) => {
  if (typeof count !== "number") return " and all of its tickets";
  if (count === 0) return "";
  return count === 1 ? " and its 1 ticket" : ` and its ${count} tickets`;
};

/**
 * Approval text of `customer.archive`. The ticket count is the one signed into the input
 * (`expectedTicketCount`, bound by `bindArchiveCustomer`), never a fresh read, so the card
 * states exactly what confirm will archive (#144). The customer is read only for its name.
 */
export async function archiveCustomerSummary({ input, context }: SummaryInput): Promise<string> {
  const id = text({ value: input.id });
  const found = await execute({ operation: getCustomer, input: { id }, context });
  const name = found.ok ? `"${found.value.name}"` : id;
  if (input.archiveTickets !== true) return `Archive customer ${name}`;
  return `Archive customer ${name}${ticketsText({ count: input.expectedTicketCount })}`;
}
