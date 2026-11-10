import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { AttemptRefInput, CreditInput, InvoicingPort, ProviderPayment } from "../types";
import { stripeBadResponse } from "./stripe-bad-response";
import { stripeFormRequest } from "./stripe-form-request";
import { issueStripeInvoice } from "./stripe-invoice";
import { stripeFetch } from "./stripe-request";

const InvoiceSchema = z.object({
  id: z.string(),
  status: z.string().nullish(),
  amount_paid: z.number().int(),
  status_transitions: z.object({ paid_at: z.number().nullish() }).nullish(),
});

const invoicePath = ({ providerReference }: { providerReference: string }) =>
  `/invoices/${encodeURIComponent(providerReference)}`;

async function voidInvoice({ auth, providerReference }: AttemptRefInput): Promise<Result<true>> {
  const account = auth.externalAccountId;
  if (!account) return stripeBadResponse({ what: "account" });
  const path = `${invoicePath({ providerReference })}/void`;
  const done = await stripeFormRequest({ path, params: {}, connectedAccountId: account });
  return done.ok ? ok({ value: true }) : done;
}

/** A credit note for part or all of a finalized invoice, as one custom line. */
async function credit({
  auth,
  providerReference,
  amountMinor,
  reason,
  idempotencyKey,
}: CreditInput) {
  const account = auth.externalAccountId;
  if (!account) return stripeBadResponse({ what: "account" });
  const done = await stripeFormRequest({
    path: "/credit_notes",
    params: {
      invoice: providerReference,
      lines: [
        {
          type: "custom_line_item",
          quantity: 1,
          unit_amount: amountMinor,
          description: reason ?? "Credit",
        },
      ],
      ...(reason ? { memo: reason } : {}),
    },
    connectedAccountId: account,
    idempotencyKey,
  });
  if (!done.ok) return done;
  const id = done.value.id;
  return typeof id === "string"
    ? ok({ value: { providerReference: id, url: null } })
    : stripeBadResponse({ what: "credit note" });
}

/** The invoice's payment, once Stripe marked it paid: the invoice id is its reference. */
async function listPayments({ auth, providerReference }: AttemptRefInput) {
  const read = await stripeFetch({
    method: "GET",
    url: `https://api.stripe.com/v1${invoicePath({ providerReference })}`,
    headers: { "Stripe-Account": auth.externalAccountId ?? "" },
  });
  if (!read.ok) return read;
  const parsed = InvoiceSchema.safeParse(read.value);
  if (!parsed.success) return stripeBadResponse({ what: "invoice" });
  const invoice = parsed.data;
  if (invoice.status !== "paid") return ok({ value: [] as ProviderPayment[] });
  const paidAt = invoice.status_transitions?.paid_at;
  return ok({
    value: [
      {
        reference: invoice.id,
        amountMinor: invoice.amount_paid,
        paidAt: paidAt ? new Date(paidAt * 1000) : new Date(),
      },
    ],
  });
}

/**
 * Stripe Invoicing on the venue's connected account (ADR 0029, 0100). Stripe keeps no books for
 * the venue, so the SIE export still carries these invoices; payments arrive as `invoice.paid`.
 */
export const stripeInvoicing: InvoicingPort = {
  issue: issueStripeInvoice,
  void: voidInvoice,
  credit,
  listPayments,
};
