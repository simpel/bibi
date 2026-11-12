import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { fortnoxGet, fortnoxRefused, fortnoxSend } from "./fortnox-request";
import type { FortnoxApi, FortnoxInvoiceRow, FortnoxPayment } from "./fortnox-types";

const CustomersSchema = z.object({
  Customers: z.array(z.object({ CustomerNumber: z.string() })).default([]),
});
const CustomerSchema = z.object({ Customer: z.object({ CustomerNumber: z.string() }) });
const InvoiceSchema = z.object({ Invoice: z.object({ DocumentNumber: z.coerce.string() }) });
const CreditSchema = z.object({
  Invoice: z.object({ CreditInvoiceReference: z.coerce.string() }),
});
const PaymentsSchema = z.object({
  InvoicePayments: z
    .array(
      z.object({
        Number: z.coerce.string(),
        Amount: z.coerce.number(),
        PaymentDate: z.string(),
      }),
    )
    .default([]),
});

const toRow = ({ row }: { row: FortnoxInvoiceRow }) => ({
  Description: row.description,
  DeliveredQuantity: row.quantity,
  Price: row.price,
  Discount: row.discountPercent,
  DiscountType: "PERCENT",
  VAT: row.vatPercent,
  AccountNumber: row.accountNumber,
});

type ListedPayment = z.infer<typeof PaymentsSchema>["InvoicePayments"][number];

const toPayment = ({ p }: { p: ListedPayment }): FortnoxPayment => ({
  number: p.Number,
  amountMinor: Math.round(p.Amount * 100),
  paidAt: new Date(`${p.PaymentDate}T12:00:00Z`),
});

type Authed = { accessToken: string };

/** The first customer matching the email, else the name (Fortnox filters are exact). */
async function findCustomer({
  accessToken,
  name,
  email,
}: Authed & { name: string; email: string | null }) {
  const filters = [
    email ? `email=${encodeURIComponent(email)}` : null,
    `name=${encodeURIComponent(name)}`,
  ];
  for (const filter of filters.filter((f): f is string => f !== null)) {
    const found = await fortnoxGet({ path: `/customers?${filter}`, accessToken });
    if (!found.ok) return found;
    const parsed = CustomersSchema.safeParse(found.value.json);
    const number = parsed.success ? parsed.data.Customers[0]?.CustomerNumber : undefined;
    if (number) return ok({ value: number as string | null });
  }
  return ok({ value: null as string | null });
}

/** Fortnox's invoicing API (ADR 0090): customers, invoices and their payments. */
export const fortnoxApi: FortnoxApi = {
  async findOrCreateCustomer({ accessToken, name, email }): Promise<Result<string>> {
    const existing = await findCustomer({ accessToken, name, email });
    if (!existing.ok || existing.value) return existing as Result<string>;
    const body = {
      Customer: { Name: name, ...(email ? { Email: email, EmailInvoice: email } : {}) },
    };
    const sent = await fortnoxSend({ method: "POST", path: "/customers", accessToken, body });
    if (!sent.ok) return sent;
    const parsed = CustomerSchema.safeParse(sent.value.json);
    if (sent.value.status !== 201 || !parsed.success) {
      return fortnoxRefused({ what: "the customer", response: sent.value });
    }
    return ok({ value: parsed.data.Customer.CustomerNumber });
  },
  async raiseInvoice({ accessToken, email, ...invoice }): Promise<Result<string>> {
    const body = {
      Invoice: {
        CustomerNumber: invoice.customerNumber,
        InvoiceDate: invoice.invoiceDate,
        ...(invoice.dueDate ? { DueDate: invoice.dueDate } : {}),
        Currency: invoice.currency,
        OurReference: invoice.ourReference.slice(0, 50),
        // The buyer's reference in both slots: e-invoices route by the electronic one (ADR 0105).
        ...(invoice.buyerReference
          ? {
              YourReference: invoice.buyerReference,
              EDIInformation: { EDIYourElectronicReference: invoice.buyerReference },
            }
          : {}),
        InvoiceRows: invoice.rows.map((row) => toRow({ row })),
      },
    };
    const created = await fortnoxSend({ method: "POST", path: "/invoices", accessToken, body });
    if (!created.ok) return created;
    const parsed = InvoiceSchema.safeParse(created.value.json);
    if (created.value.status !== 201 || !parsed.success) {
      return fortnoxRefused({ what: "the invoice", response: created.value });
    }
    const number = parsed.data.Invoice.DocumentNumber;
    const path = `/invoices/${encodeURIComponent(number)}`;
    const booked = await fortnoxSend({ method: "PUT", path: `${path}/bookkeep`, accessToken });
    if (!booked.ok) return booked;
    if (booked.value.status !== 200)
      return fortnoxRefused({ what: "the bookkeeping", response: booked.value });
    if (email) {
      const mailed = await fortnoxGet({ path: `${path}/email`, accessToken });
      if (!mailed.ok) return mailed;
      if (mailed.value.status !== 200)
        return fortnoxRefused({ what: "the email", response: mailed.value });
    }
    return ok({ value: number });
  },
  async listPayments({ accessToken, documentNumber }): Promise<Result<FortnoxPayment[]>> {
    const path = `/invoicepayments?invoicenumber=${encodeURIComponent(documentNumber)}`;
    const found = await fortnoxGet({ path, accessToken });
    if (!found.ok) return found;
    const parsed = PaymentsSchema.safeParse(found.value.json);
    if (found.value.status !== 200 || !parsed.success) {
      return fortnoxRefused({ what: "the payment lookup", response: found.value });
    }
    return ok({ value: parsed.data.InvoicePayments.map((p) => toPayment({ p })) });
  },
  async cancelInvoice({ accessToken, documentNumber }): Promise<Result<true>> {
    const path = `/invoices/${encodeURIComponent(documentNumber)}/cancel`;
    const sent = await fortnoxSend({ method: "PUT", path, accessToken });
    if (!sent.ok) return sent;
    if (sent.value.status !== 200)
      return fortnoxRefused({ what: "the cancel", response: sent.value });
    return ok({ value: true });
  },
  async creditInvoice({ accessToken, documentNumber }): Promise<Result<string>> {
    const path = `/invoices/${encodeURIComponent(documentNumber)}/credit`;
    const sent = await fortnoxSend({ method: "PUT", path, accessToken });
    if (!sent.ok) return sent;
    const parsed = CreditSchema.safeParse(sent.value.json);
    if (sent.value.status !== 200 || !parsed.success) {
      return fortnoxRefused({ what: "the credit", response: sent.value });
    }
    return ok({ value: parsed.data.Invoice.CreditInvoiceReference });
  },
};
