import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";

export type InvoiceReferenceInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
  /** The invoice's snapshot, if it already has one; it wins over the order's current value. */
  frozen?: string | null;
};

/**
 * The buyer's reference an invoice of the order carries (ADR 0105): its snapshot, else the
 * order's own, else its contact's. `VALIDATION` at `buyerReference` when the customer requires
 * one and there is none.
 */
export async function invoiceBuyerReference({
  context,
  orderId,
  frozen = null,
}: InvoiceReferenceInput): Promise<Result<string | null>> {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: {
      buyerReference: true,
      contact: { select: { buyerReference: true } },
      customer: { select: { requiresBuyerReference: true } },
    },
  });
  if (!order) return notFound({ entity: "Order" });
  const reference = frozen ?? order.buyerReference ?? order.contact?.buyerReference ?? null;
  if (reference === null && order.customer.requiresBuyerReference) {
    const message =
      "The customer requires the buyer's reference on invoices; set it on the order or its contact";
    return invalid({ message, issues: [{ path: "buyerReference", message }] });
  }
  return ok({ value: reference });
}

export type FillReferenceInput = { context: Pick<OperationContext, "db">; invoiceId: string };

/**
 * Before a DRAFT is sent (ADR 0105): one without a frozen reference takes the order's current
 * one, so a reference added after the invoice was created still reaches the customer; the
 * customer's requirement is checked again.
 */
export async function fillBuyerReference({
  context,
  invoiceId,
}: FillReferenceInput): Promise<Result<true>> {
  const invoice = await context.db.invoice.findFirst({
    where: { id: invoiceId },
    select: { orderId: true, buyerReference: true },
  });
  if (!invoice) return notFound({ entity: "Invoice" });
  const { orderId, buyerReference: frozen } = invoice;
  const reference = await invoiceBuyerReference({ context, orderId, frozen });
  if (!reference.ok) return reference;
  if (frozen === null && reference.value !== null) {
    await context.db.invoice.updateMany({
      where: { id: invoiceId, status: "DRAFT", buyerReference: null },
      data: { buyerReference: reference.value },
    });
  }
  return ok({ value: true });
}
