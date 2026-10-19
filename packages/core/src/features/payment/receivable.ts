import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { checkReadable } from "../ticket/ticket-rules";
import type { PaymentCreateInput } from "./schema";
import type { ReceivableRef } from "./settlement";

type Context = Pick<OperationContext, "db" | "permissions">;

/** A receivable a payment can be requested against, with its fixed amount. */
export type Receivable = {
  ref: ReceivableRef;
  ticketId: string;
  amountMinor: number;
  currency: string;
  /** What the customer sees on the charge unless the request gives its own text. */
  description: string;
};

const NONE: ReceivableRef = { quoteId: null, depositId: null, invoiceId: null };

type FindInput = { context: Context; id: string };

async function findQuote({ context, id }: FindInput): Promise<Result<Receivable>> {
  const readable = checkReadable({ context, permission: "quote:read", path: "quoteId" });
  if (!readable.ok) return readable;
  const quote = await context.db.quote.findFirst({ where: { id }, include: { ticket: true } });
  if (!quote) return notFound({ entity: "Quote" });
  if (quote.quoteStatus !== "SENT" && quote.quoteStatus !== "ACCEPTED") {
    return conflict({ message: `A ${quote.quoteStatus} quote cannot be paid` });
  }
  const { ticketId, totalInclVatMinor: amountMinor, version } = quote;
  const description = `Ticket #${quote.ticket.reference}, quote v${version}`;
  return ok({
    value: { ref: { ...NONE, quoteId: id }, ticketId, amountMinor, currency: "SEK", description },
  });
}

async function findDeposit({ context, id }: FindInput): Promise<Result<Receivable>> {
  const deposit = await context.db.deposit.findFirst({ where: { id } });
  if (!deposit) return notFound({ entity: "Deposit" });
  if (deposit.status !== "SENT")
    return conflict({ message: `A ${deposit.status} deposit cannot be paid` });
  const { ticketId, amountMinor, currency, description } = deposit;
  return ok({
    value: { ref: { ...NONE, depositId: id }, ticketId, amountMinor, currency, description },
  });
}

async function findInvoice({ context, id }: FindInput): Promise<Result<Receivable>> {
  const invoice = await context.db.invoice.findFirst({ where: { id } });
  if (!invoice) return notFound({ entity: "Invoice" });
  if (invoice.status !== "SENT")
    return conflict({ message: `A ${invoice.status} invoice cannot be paid` });
  const { ticketId, totalInclVatMinor: amountMinor, currency, number } = invoice;
  const description = `Invoice #${number}`;
  return ok({
    value: { ref: { ...NONE, invoiceId: id }, ticketId, amountMinor, currency, description },
  });
}

export type LoadReceivableInput = { context: Context; input: PaymentCreateInput };

/** The one receivable the request names (`VALIDATION` unless exactly one id is given). */
export async function loadReceivable({
  context,
  input: { quoteId, depositId, invoiceId },
}: LoadReceivableInput): Promise<Result<Receivable>> {
  const given = [quoteId, depositId, invoiceId].filter((id) => id !== undefined).length;
  if (given !== 1) {
    const message = "Give exactly one of quoteId, depositId and invoiceId";
    return invalid({ message, issues: [{ path: "quoteId", message }] });
  }
  if (depositId) return findDeposit({ context, id: depositId });
  if (invoiceId) return findInvoice({ context, id: invoiceId });
  return findQuote({ context, id: quoteId ?? "" });
}

export type ClaimReceivableInput = { context: Pick<OperationContext, "db">; ref: ReceivableRef };

/**
 * Locks a SENT deposit or invoice row for the rest of the transaction (a no-op update), so a
 * concurrent void waits and then sees the new payment, or this request sees the VOID.
 */
export async function claimReceivable({
  context,
  ref,
}: ClaimReceivableInput): Promise<Result<true>> {
  const where = { status: "SENT" as const };
  const data = { status: "SENT" as const };
  const claimed = ref.depositId
    ? await context.db.deposit.updateMany({ where: { ...where, id: ref.depositId }, data })
    : ref.invoiceId
      ? await context.db.invoice.updateMany({ where: { ...where, id: ref.invoiceId }, data })
      : { count: 1 };
  if (claimed.count > 0) return ok({ value: true });
  return conflict({ message: "It is no longer SENT" });
}
