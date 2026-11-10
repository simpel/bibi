import type { Result } from "../../errors/result";
import { createObject, defaultTermsId, firstId } from "./visma-lookups";
import { odataString } from "./visma-request";

export type VismaCustomerInput = { accessToken: string; name: string; email: string | null };

const filterPath = ({ field, value }: { field: string; value: string }) =>
  `/customers?$filter=${encodeURIComponent(`${field} eq ${odataString({ value })}`)}`;

/**
 * The venue's customer in Visma: the first matching the email, else the name, else a new one.
 * Bibi's snapshot has no address, so the required invoice city and postal code are placeholders
 * staff can complete in Visma. // Verify against Visma sandbox (required customer fields)
 */
export async function findOrCreateCustomer({
  accessToken,
  name,
  email,
}: VismaCustomerInput): Promise<Result<string>> {
  const what = "the customer";
  const lookups = [
    ...(email ? [{ field: "EmailAddress", value: email }] : []),
    { field: "Name", value: name },
  ];
  for (const lookup of lookups) {
    const found = await firstId({ accessToken, path: filterPath(lookup), what });
    if (!found.ok || found.value) return found as Result<string>;
  }
  const terms = await defaultTermsId({ accessToken });
  if (!terms.ok) return terms;
  const body = {
    Name: name,
    ...(email ? { EmailAddress: email } : {}),
    InvoiceCity: "-",
    InvoicePostalCode: "-",
    IsPrivatePerson: false,
    IsActive: true,
    TermsOfPaymentId: terms.value,
  };
  return createObject({ accessToken, path: "/customers", body, what });
}
