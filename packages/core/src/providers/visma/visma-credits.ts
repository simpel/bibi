import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { CreditState } from "../types";
import { paged } from "./visma-lookups";
import { vismaCall, vismaRefused } from "./visma-request";

const CreditSchema = z.object({ Id: z.string().min(1), TotalAmount: z.coerce.number() });

export type FindCreditInput = {
  accessToken: string;
  /** The credited invoice's id. */
  invoiceId: string;
  amountMinor: number;
  known: readonly string[];
};

/**
 * The credit invoice Bibi asked for when its answer was lost (the credit retry, ADR 0100): among
 * the credit invoices of the invoice, one of the same amount that Bibi has not recorded yet. A
 * credit can be partial, so the amount tells it apart. // Verify against Visma sandbox (filter)
 */
export async function findCredit({
  accessToken,
  invoiceId,
  amountMinor,
  known,
}: FindCreditInput): Promise<Result<CreditState>> {
  const filter = encodeURIComponent(`CreditedInvoiceId eq ${invoiceId}`);
  const found = await vismaCall({ path: `/customerinvoices?$filter=${filter}`, accessToken });
  if (!found.ok) return found;
  const parsed = paged({ item: CreditSchema }).safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success) {
    return vismaRefused({ what: "the credit lookup", response: found.value });
  }
  const match = parsed.data.Data.find(
    (credit) =>
      !known.includes(credit.Id) && Math.round(Math.abs(credit.TotalAmount) * 100) === amountMinor,
  );
  return ok({
    value: match ? { status: "ISSUED", providerReference: match.Id } : { status: "MISSING" },
  });
}
