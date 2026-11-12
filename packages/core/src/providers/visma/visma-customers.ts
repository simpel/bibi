import type { Result } from "../../errors/result";
import { createObject, defaultTermsId, firstId } from "./visma-lookups";
import { odataString } from "./visma-request";

export type VismaCustomerInput = {
  accessToken: string;
  name: string;
  email: string | null;
  /** A business's organisation number (ADR 0106); null for a private person. */
  organizationNumber: string | null;
  buyerKind: "BUSINESS" | "PRIVATE";
};

const filterPath = ({ field, value }: { field: string; value: string }) =>
  `/customers?$filter=${encodeURIComponent(`${field} eq ${odataString({ value })}`)}`;

/**
 * The venue's customer in Visma: the first matching the organisation number, else the email,
 * else the name, else a new one, private or a business with its number (ADR 0106).
 * Bibi's snapshot has no address, so the required invoice city and postal code are placeholders
 * staff can complete in Visma. // Verify against Visma sandbox (required customer fields)
 */
export async function findOrCreateCustomer({
  accessToken,
  name,
  email,
  organizationNumber,
  buyerKind,
}: VismaCustomerInput): Promise<Result<string>> {
  const what = "the customer";
  const lookups = [
    ...(organizationNumber
      ? [{ field: "CorporateIdentityNumber", value: organizationNumber }]
      : []),
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
    ...(organizationNumber ? { CorporateIdentityNumber: organizationNumber } : {}),
    InvoiceCity: "-",
    InvoicePostalCode: "-",
    IsPrivatePerson: buyerKind === "PRIVATE",
    IsActive: true,
    TermsOfPaymentId: terms.value,
  };
  return createObject({ accessToken, path: "/customers", body, what });
}
