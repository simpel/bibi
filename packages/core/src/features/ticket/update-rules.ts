import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { TicketDto, TicketUpdateInput } from "./schema";
import { checkContact, checkCustomer, checkDesiredPeriod, checkReadable } from "./ticket-rules";

export type CheckTicketDetailsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  before: TicketDto;
  change: Omit<TicketUpdateInput, "id" | "fields">;
};

/** The given value, or the stored one when the update omits it (null clears). */
const pick = <T>({ given, stored }: { given: T | undefined; stored: T }): T =>
  given === undefined ? stored : given;

/** The details after a `ticket.update` must still hold together: dates, customer and contact. */
export async function checkTicketDetails({
  context,
  before,
  change,
}: CheckTicketDetailsInput): Promise<Result<true>> {
  const period = checkDesiredPeriod({
    desiredStartsAt: pick({ given: change.desiredStartsAt, stored: before.desiredStartsAt }),
    desiredEndsAt: pick({ given: change.desiredEndsAt, stored: before.desiredEndsAt }),
  });
  if (!period.ok) return period;
  const customerId = change.customerId ?? before.customerId;
  if (customerId !== before.customerId) {
    const readable = checkReadable({ context, permission: "customer:read", path: "customerId" });
    if (!readable.ok) return readable;
    const customer = await checkCustomer({ context, customerId });
    if (!customer.ok) return customer;
  }
  const contactId = pick({ given: change.contactId, stored: before.contactId });
  // An unchanged reference stays valid even if the contact was archived since.
  if (contactId === before.contactId && customerId === before.customerId) {
    return ok({ value: true });
  }
  if (contactId) {
    const readable = checkReadable({ context, permission: "customer:read", path: "contactId" });
    if (!readable.ok) return readable;
  }
  const contact = await checkContact({ context, contactId, customerId });
  return contact.ok ? ok({ value: true }) : contact;
}
