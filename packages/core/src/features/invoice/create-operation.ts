import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { DEFAULT_INVOICE_DAYS } from "../payment/request-charge";
import { requireLedger } from "../payment/require-ledger";
import { checkLinesReadable } from "../quote/check-lines-readable";
import { checkPricedLines } from "../quote/check-priced-lines";
import { deriveOrderLines } from "../quote/derive-lines";
import { writeOrderLines } from "../quote/freeze-lines";
import { quoteTotals } from "../quote/line-totals";
import { invoiceBuyerReference } from "./buyer-reference";
import { deductPaidDeposits } from "./deduct-deposits";
import { type InvoiceCreateInput, InvoiceCreateInputSchema, InvoiceSchema } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type Context = Pick<OperationContext, "db" | "permissions">;

type InvoiceableInput = { context: Context; input: InvoiceCreateInput };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * An invoice needs an order in an `invoiceable` status without another invoice that is not VOID
 * (the partial unique index refuses a concurrent second one); its due date follows the
 * customer's payment terms unless given.
 */
async function checkInvoiceable({ context, input }: InvoiceableInput): Promise<Result<Date>> {
  const order = await context.db.order.findFirst({
    where: { id: input.orderId },
    include: { orderStatus: { select: { name: true, invoiceable: true } }, customer: true },
  });
  if (!order) return notFound({ entity: "Order" });
  if (!order.orderStatus.invoiceable) {
    return conflict({
      message: `An order in "${order.orderStatus.name}" cannot be invoiced yet`,
    });
  }
  const open = await context.db.invoice.count({
    where: { orderId: input.orderId, status: { not: "VOID" } },
  });
  if (open > 0) return conflict({ message: "The order already has an invoice; void it first" });
  const days = order.customer.paymentTermsDays ?? DEFAULT_INVOICE_DAYS;
  return ok({ value: input.dueDate ?? new Date(Date.now() + days * DAY_MS) });
}

export const createInvoice = defineOperation({
  name: "invoice.create",
  kind: "command",
  description:
    "Invoice an order (ADR 0052, 0057): freezes its priced lines as the invoice's snapshot " +
    "with totals and the organization's next invoice number, as a DRAFT. The order's status " +
    "must be invoiceable and the order must have no other invoice that is not VOID. Each " +
    "line needs a quantity and VAT. Paid deposits on the order are deducted (deductions, " +
    "amountDueMinor), as paid now (ADR 0090). The order's buyer's reference (its own, " +
    "else its contact's) is frozen on it; a customer that requires one is a VALIDATION error " +
    "at buyerReference without it (ADR 0105). Needs a connected accounting system (Fortnox, " +
    "Visma) that takes invoices (CONFLICT without one, ADR 0106). Send it (invoice.send) before requesting payment " +
    "(payment.create with invoiceId).",
  input: InvoiceCreateInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    // The snapshot copies the order's lines and their items, so the caller must read both.
    const readable = checkLinesReadable({ context, path: "orderId" });
    if (!readable.ok) return readable;
    const dueDate = await checkInvoiceable({ context, input });
    if (!dueDate.ok) return dueDate;
    const ledger = await requireLedger({ context });
    if (!ledger.ok) return ledger;
    const buyerReference = await invoiceBuyerReference({ context, orderId: input.orderId });
    if (!buyerReference.ok) return buyerReference;
    const derived =
      (await deriveOrderLines({ context, orderIds: [input.orderId] })).get(input.orderId) ?? [];
    const priced = checkPricedLines({ lines: derived, what: "An invoice" });
    if (!priced.ok) return priced;
    const lines = derived.map((d) => d.line);
    // Bibi numbers nothing: the accounting system does when it is raised (ADR 0106).
    const row = await context.db.invoice.create({
      data: {
        organizationId: context.organizationId,
        orderId: input.orderId,
        dueDate: dueDate.value,
        buyerReference: buyerReference.value,
        ...quoteTotals({ lines }),
        createdBy: context.actor.userId,
      },
    });
    await writeOrderLines({ context, owner: { invoiceId: row.id }, lines });
    await deductPaidDeposits({ context, invoiceId: row.id, orderId: input.orderId });
    const invoice = await loadInvoice({ context, id: row.id });
    if (!invoice) return notFound({ entity: "Invoice" });
    context.recordChange({ entityId: row.id, after: invoice });
    return ok({ value: invoice });
  },
});
