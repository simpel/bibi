import { z } from "zod";
import { err, ok, type Result } from "../../errors/result";
import type { CreateInvoiceInput, InvoiceRef } from "./provider";
import { stripeBadResponse } from "./stripe-bad-response";
import { type FormParams, stripeFormRequest } from "./stripe-form-request";

const IdSchema = z.object({ id: z.string() });
const FinalizedSchema = z.object({ id: z.string(), hosted_invoice_url: z.string() });

type StepInput = { input: CreateInvoiceInput; path: string; step: string; params: FormParams };

/** One idempotent step of the invoice flow; each step gets its own derived key. */
function step({ input, path, step, params }: StepInput) {
  return stripeFormRequest({
    path,
    params,
    connectedAccountId: input.connectedAccountId,
    idempotencyKey: `${input.idempotencyKey}-${step}`,
  });
}

type IdStepInput = StepInput & { what: string };

async function idStep({ what, ...rest }: IdStepInput): Promise<Result<string>> {
  const result = await step(rest);
  if (!result.ok) return err({ error: result.error });
  const parsed = IdSchema.safeParse(result.value);
  return parsed.success ? ok({ value: parsed.data.id }) : stripeBadResponse({ what });
}

type DraftInput = { input: CreateInvoiceInput; customerId: string };

/** The draft invoice and its single line; the application fee sits on the invoice. */
async function createDraft({ input, customerId }: DraftInput): Promise<Result<string>> {
  const invoiceId = await idStep({
    input,
    what: "invoice",
    step: "invoice",
    path: "/invoices",
    params: {
      customer: customerId,
      currency: input.currency.toLowerCase(),
      collection_method: "send_invoice",
      days_until_due: input.daysUntilDue,
      application_fee_amount: input.applicationFeeMinor,
      metadata: input.metadata,
    },
  });
  if (!invoiceId.ok) return invoiceId;
  const item = await idStep({
    input,
    what: "invoice item",
    step: "item",
    path: "/invoiceitems",
    params: {
      customer: customerId,
      invoice: invoiceId.value,
      amount: input.amountMinor,
      currency: input.currency.toLowerCase(),
      description: input.description,
    },
  });
  return item.ok ? invoiceId : item;
}

/**
 * Stripe Invoicing on the connected account (ADR 0029): customer, draft invoice with one line,
 * finalize, send. Every step is idempotent, so a retried request resumes instead of duplicating.
 */
export async function createStripeInvoice({
  ...input
}: CreateInvoiceInput): Promise<Result<InvoiceRef>> {
  const customerId = await idStep({
    input,
    what: "customer",
    step: "customer",
    path: "/customers",
    params: { ...input.recipient, metadata: input.metadata },
  });
  if (!customerId.ok) return customerId;
  const invoiceId = await createDraft({ input, customerId: customerId.value });
  if (!invoiceId.ok) return invoiceId;
  const path = `/invoices/${encodeURIComponent(invoiceId.value)}`;
  const finalized = await step({ input, path: `${path}/finalize`, step: "finalize", params: {} });
  if (!finalized.ok) return err({ error: finalized.error });
  const parsed = FinalizedSchema.safeParse(finalized.value);
  if (!parsed.success) return stripeBadResponse({ what: "invoice" });
  const sent = await step({ input, path: `${path}/send`, step: "send", params: {} });
  if (!sent.ok) return err({ error: sent.error });
  return ok({ value: { providerReference: parsed.data.id, url: parsed.data.hosted_invoice_url } });
}
