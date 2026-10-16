import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkCustomer } from "../booking/booking-rules";
import { checkContact, checkDesiredPeriod } from "./inquiry-rules";
import type { InquiryDto, InquiryUpdateInput } from "./schema";

export type CheckInquiryDetailsInput = {
  context: Pick<OperationContext, "db">;
  before: InquiryDto;
  change: Omit<InquiryUpdateInput, "id" | "fields">;
};

/** The given value, or the stored one when the update omits it (null clears). */
const pick = <T>({ given, stored }: { given: T | undefined; stored: T }): T =>
  given === undefined ? stored : given;

/** The details after an `inquiry.update` must still hold together: dates, customer and contact. */
export async function checkInquiryDetails({
  context,
  before,
  change,
}: CheckInquiryDetailsInput): Promise<Result<true>> {
  const period = checkDesiredPeriod({
    desiredStartsAt: pick({ given: change.desiredStartsAt, stored: before.desiredStartsAt }),
    desiredEndsAt: pick({ given: change.desiredEndsAt, stored: before.desiredEndsAt }),
  });
  if (!period.ok) return period;
  const customerId = change.customerId ?? before.customerId;
  if (customerId !== before.customerId) {
    const customer = await checkCustomer({ context, customerId });
    if (!customer.ok) return customer;
  }
  const contactId = pick({ given: change.contactId, stored: before.contactId });
  // An unchanged reference stays valid even if the contact was archived since.
  if (contactId === before.contactId && customerId === before.customerId) {
    return ok({ value: true });
  }
  const contact = await checkContact({ context, contactId, customerId });
  return contact.ok ? ok({ value: true }) : contact;
}
