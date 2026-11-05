import { ok } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import { missing } from "./seed-fields";

export type PartyInput = { context: ExecuteContext; customer: string };

/** The customer by name and its first contact: every new order needs one (ADR 0081). */
export async function loadParty({ context, customer }: PartyInput) {
  const row = await context.db.customer.findFirst({ where: { name: customer } });
  if (!row) return missing({ what: `customer ${customer}` });
  const contact = await context.db.contact.findFirst({
    where: { customerId: row.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (!contact) return missing({ what: `a contact at ${customer}` });
  return ok({ value: { customerId: row.id, contactId: contact.id } });
}
