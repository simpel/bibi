import { z } from "zod";
import { err, ok, type Result } from "../../errors/result";
import type { InvoiceSnapshot, InvoiceSnapshotLine, IssueInput } from "../types";
import { stripeBadResponse } from "./stripe-bad-response";
import { type FormParams, stripeFormRequest } from "./stripe-form-request";

const IdSchema = z.object({ id: z.string() });
const FinalizedSchema = z.object({ id: z.string(), hosted_invoice_url: z.string().nullish() });

const DEFAULT_DAYS_UNTIL_DUE = 30;

type Flow = { account: string; key: string };
type StepInput = Flow & { path: string; step: string; params: FormParams };

/** One idempotent step of the invoice flow; each step gets its own derived key. */
function step({ account, key, path, step, params }: StepInput) {
  return stripeFormRequest({
    path,
    params,
    connectedAccountId: account,
    idempotencyKey: `${key}-${step}`,
  });
}

async function idStep({ what, ...rest }: StepInput & { what: string }): Promise<Result<string>> {
  const result = await step(rest);
  if (!result.ok) return err({ error: result.error });
  const parsed = IdSchema.safeParse(result.value);
  return parsed.success ? ok({ value: parsed.data.id }) : stripeBadResponse({ what });
}

/** A line's amount incl. VAT: each VAT row's net plus its VAT (Stripe gets gross amounts). */
export function grossOf({ line }: { line: InvoiceSnapshotLine }): number {
  return line.vatRows.reduce(
    (sum, row) => sum + Math.round((row.totalExclVatMinor * (100 + row.vatRatePercent)) / 100),
    0,
  );
}

/** The invoice's items: one per frozen line, and each deducted deposit as a negative item. */
function itemsOf({ invoice }: { invoice: InvoiceSnapshot }) {
  return [
    ...invoice.lines.map((line) => ({
      amount: grossOf({ line }),
      description: `${line.name} × ${line.quantity}`,
    })),
    ...invoice.deductions.map((d) => ({ amount: -d.amountMinor, description: d.description })),
  ];
}

function dueParams({ invoice }: { invoice: InvoiceSnapshot }): FormParams {
  if (!invoice.dueDate) return { days_until_due: DEFAULT_DAYS_UNTIL_DUE };
  return { due_date: Math.floor(new Date(`${invoice.dueDate}T12:00:00Z`).getTime() / 1000) };
}

type DraftInput = Flow & { invoice: InvoiceSnapshot; customerId: string };

/** The draft invoice and its items on the connected account. */
async function createDraft({ invoice, customerId, ...flow }: DraftInput): Promise<Result<string>> {
  const currency = invoice.currency.toLowerCase();
  const invoiceId = await idStep({
    ...flow,
    what: "invoice",
    step: "invoice",
    path: "/invoices",
    params: {
      customer: customerId,
      currency,
      collection_method: "send_invoice",
      description: invoice.reference,
      ...dueParams({ invoice }),
    },
  });
  if (!invoiceId.ok) return invoiceId;
  for (const [index, item] of itemsOf({ invoice }).entries()) {
    const added = await idStep({
      ...flow,
      what: "invoice item",
      step: `item-${index}`,
      path: "/invoiceitems",
      params: { customer: customerId, invoice: invoiceId.value, currency, ...item },
    });
    if (!added.ok) return added;
  }
  return invoiceId;
}

/**
 * Stripe Invoicing on the connected account (ADR 0029, 0100): the customer, a draft with one item
 * per frozen line (incl. VAT) and the deducted deposits, finalized, then emailed when the customer
 * has an email. Every step is idempotent on Bibi's invoice id, so a retry resumes.
 */
export async function issueStripeInvoice({ auth, invoice, idempotencyKey }: IssueInput) {
  const account = auth.externalAccountId;
  if (!account) return stripeBadResponse({ what: "account" });
  const flow = { account, key: idempotencyKey };
  const { name, email } = invoice.customer;
  const customerId = await idStep({
    ...flow,
    what: "customer",
    step: "customer",
    path: "/customers",
    params: { name, ...(email ? { email } : {}) },
  });
  if (!customerId.ok) return customerId;
  const invoiceId = await createDraft({ ...flow, invoice, customerId: customerId.value });
  if (!invoiceId.ok) return invoiceId;
  const path = `/invoices/${encodeURIComponent(invoiceId.value)}`;
  const finalized = await step({ ...flow, path: `${path}/finalize`, step: "finalize", params: {} });
  if (!finalized.ok) return err({ error: finalized.error });
  const parsed = FinalizedSchema.safeParse(finalized.value);
  if (!parsed.success) return stripeBadResponse({ what: "invoice" });
  if (email) {
    const sent = await step({ ...flow, path: `${path}/send`, step: "send", params: {} });
    if (!sent.ok) return err({ error: sent.error });
  }
  const url = parsed.data.hosted_invoice_url ?? null;
  return ok({ value: { providerReference: parsed.data.id, url } });
}
