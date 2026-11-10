import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { notFound } from "../../shared/errors";
import { createObject } from "./visma-lookups";
import { vismaCall, vismaRefused } from "./visma-request";
import type { VismaRow } from "./visma-rows";

type Authed = { accessToken: string };

/** A customer invoice as Bibi reads it back. // Verify against Visma sandbox */
export const VismaInvoiceSchema = z.object({
  Id: z.string(),
  CustomerId: z.string(),
  InvoiceDate: z.string().nullish(),
  CurrencyCode: z.string().nullish(),
  TotalAmount: z.coerce.number(),
  TotalVatAmount: z.coerce.number().nullish(),
  RemainingAmount: z.coerce.number(),
  Rows: z
    .array(
      z.object({
        ArticleId: z.string().nullish(),
        Text: z.string().nullish(),
        UnitPrice: z.coerce.number().nullish(),
        Quantity: z.coerce.number().nullish(),
        DiscountPercentage: z.coerce.number().nullish(),
      }),
    )
    .default([]),
});

export type VismaInvoice = z.infer<typeof VismaInvoiceSchema>;

export type CreateInvoiceInput = Authed & {
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  currency: string;
  /** Bibi's reference shown on the invoice (`Order #..., invoice #...`). */
  reference: string;
  rows: VismaRow[];
  /** For a credit invoice: the invoice it credits. */
  creditedInvoiceId?: string;
};

/**
 * POST `/customerinvoices`: a booked customer invoice (not a draft), so it is in the ledger at
 * once. Returns its id. // Verify against Visma sandbox (required fields, sending by email)
 */
export function createInvoice({
  accessToken,
  ...invoice
}: CreateInvoiceInput): Promise<Result<string>> {
  const body = {
    CustomerId: invoice.customerId,
    InvoiceDate: invoice.invoiceDate,
    ...(invoice.dueDate ? { DueDate: invoice.dueDate } : {}),
    CurrencyCode: invoice.currency,
    YourReference: invoice.reference.slice(0, 50),
    RotReducedInvoicingType: 0,
    EuThirdParty: false,
    IsCreditInvoice: Boolean(invoice.creditedInvoiceId),
    ...(invoice.creditedInvoiceId ? { CreditedInvoiceId: invoice.creditedInvoiceId } : {}),
    Rows: invoice.rows.map((row, index) => ({ LineNumber: index + 1, ...row })),
  };
  const what = invoice.creditedInvoiceId ? "the credit invoice" : "the invoice";
  return createObject({ accessToken, path: "/customerinvoices", body, what });
}

/** GET `/customerinvoices/{id}`: totals, what is left to pay and the rows. */
export async function readInvoice({
  accessToken,
  id,
}: Authed & { id: string }): Promise<Result<VismaInvoice>> {
  const path = `/customerinvoices/${encodeURIComponent(id)}`;
  const found = await vismaCall({ path, accessToken });
  if (!found.ok) return found;
  if (found.value.status === 404) return notFound({ entity: "Visma invoice" });
  const parsed = VismaInvoiceSchema.safeParse(found.value.json);
  if (found.value.status !== 200 || !parsed.success) {
    return vismaRefused({ what: "the invoice lookup", response: found.value });
  }
  return ok({ value: parsed.data });
}

export type CreditRowsInput = { invoice: VismaInvoice; amountMinor: number };

/**
 * The original's rows negated for a credit invoice; a partial credit scales every row by the
 * share credited, so each VAT rate is credited in proportion.
 */
export function creditRows({ invoice, amountMinor }: CreditRowsInput): VismaRow[] {
  const totalMinor = Math.round(invoice.TotalAmount * 100);
  const share = totalMinor > 0 ? Math.min(1, amountMinor / totalMinor) : 1;
  return invoice.Rows.flatMap((row) =>
    row.ArticleId
      ? [
          {
            ArticleId: row.ArticleId,
            Text: row.Text ?? "",
            UnitPrice: -Math.round((row.UnitPrice ?? 0) * share * 100) / 100,
            Quantity: row.Quantity ?? 1,
            DiscountPercentage: row.DiscountPercentage ?? 0,
          },
        ]
      : [],
  );
}
