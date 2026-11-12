import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { DUE_INCLUDE, invoiceDueMinor } from "../invoice/to-invoice-dto";
import type { PaymentCreateInput } from "./schema";
import type { ReceivableRef } from "./settlement";

type Context = Pick<OperationContext, "db" | "permissions">;

/** A receivable a payment can be requested against, with its fixed amount. */
export type Receivable = {
  ref: ReceivableRef;
  orderId: string;
  amountMinor: number;
  currency: string;
  /** What the customer sees on the charge unless the request gives its own text. */
  description: string;
};

const NONE: ReceivableRef = { quoteId: null, depositId: null, invoiceId: null };

type FindInput = { context: Context; id: string };

async function findDeposit({ context, id }: FindInput): Promise<Result<Receivable>> {
  const deposit = await context.db.deposit.findFirst({ where: { id } });
  if (!deposit) return notFound({ entity: "Deposit" });
  if (deposit.status !== "SENT")
    return conflict({ message: `A ${deposit.status} deposit cannot be paid` });
  const { orderId, amountMinor, currency, description } = deposit;
  return ok({
    value: { ref: { ...NONE, depositId: id }, orderId, amountMinor, currency, description },
  });
}

async function findInvoice({ context, id }: FindInput): Promise<Result<Receivable>> {
  const invoice = await context.db.invoice.findFirst({
    where: { id },
    include: DUE_INCLUDE,
  });
  if (!invoice) return notFound({ entity: "Invoice" });
  if (invoice.status !== "SENT")
    return conflict({ message: `A ${invoice.status} invoice cannot be paid` });
  const { orderId, currency, number } = invoice;
  const amountMinor = invoiceDueMinor({ invoice, ...invoice });
  const description = `Invoice #${number}`;
  return ok({
    value: { ref: { ...NONE, invoiceId: id }, orderId, amountMinor, currency, description },
  });
}

export type LoadReceivableInput = {
  context: Context;
  input: Pick<PaymentCreateInput, "depositId" | "invoiceId">;
};

/**
 * The one receivable the request names (`VALIDATION` unless exactly one id is given). A quote is
 * never paid directly: accepting it leads to its deposit (ADR 0106).
 */
export async function loadReceivable({
  context,
  input: { depositId, invoiceId },
}: LoadReceivableInput): Promise<Result<Receivable>> {
  const given = [depositId, invoiceId].filter((id) => id !== undefined).length;
  if (given !== 1) {
    const message = "Give exactly one of depositId and invoiceId";
    return invalid({ message, issues: [{ path: "depositId", message }] });
  }
  if (depositId) return findDeposit({ context, id: depositId });
  return findInvoice({ context, id: invoiceId ?? "" });
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
