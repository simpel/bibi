import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";
import { moveReceivable } from "../payment/move-receivable";
import { receivableMoveDates } from "../payment/receivable-lifecycle";
import type { ReceivableStatus } from "../payment/settlement-schema";
import { resolveInvoiceProvider } from "./invoice-provider";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { syncWithFortnox } from "./sync-operation";
import { loadInvoice } from "./to-invoice-dto";

type MoveInput = {
  context: Pick<OperationContext, "db" | "recordChange" | "now">;
  id: string;
  to: ReceivableStatus;
};

const moveInvoice = ({ context, id, to }: MoveInput): Promise<Result<InvoiceDto>> =>
  moveReceivable({
    context,
    kind: "invoice",
    id,
    to,
    load: () => loadInvoice({ context, id }),
    claim: async ({ from, to }) =>
      (
        await context.db.invoice.updateMany({
          where: { id, status: from },
          data: { status: to, ...receivableMoveDates({ to, at: nowOf({ context }) }) },
        })
      ).count,
  });

export const sendInvoice = defineOperation({
  name: "invoice.send",
  kind: "command",
  description:
    "Mark a DRAFT invoice as SENT to the customer; it becomes what the ticket owes. It is " +
    "raised where the payment settings say (ADR 0090): in the venue's Fortnox (created, booked " +
    "and emailed there; payments are mirrored back), or kept in Bibi for payments requested " +
    "through Stripe (payment.create). Any other starting status is a CONFLICT.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input: { id }, context }) => {
    const provider = await resolveInvoiceProvider({ context });
    if (!provider.ok) return provider;
    const sent = await moveInvoice({ context, id, to: "SENT" });
    if (!sent.ok || provider.value === null) return sent;
    await context.db.invoice.update({ where: { id }, data: { provider: provider.value } });
    return ok({ value: { ...sent.value, provider: provider.value } });
  },
  // Fortnox only after the commit (ADR 0058); a failure leaves it SENT without a document
  // number, and invoice.sync raises it again.
  external: ({ output, context }) =>
    output.provider === "FORTNOX"
      ? syncWithFortnox({ context, invoice: output })
      : Promise.resolve(ok({ value: output })),
});

export const voidInvoice = defineOperation({
  name: "invoice.void",
  kind: "command",
  description:
    "Void a DRAFT or SENT invoice: it is no longer owed and the ticket can be invoiced again. " +
    "Refused (CONFLICT) while a payment against it is PENDING or anything paid against it has " +
    "not been refunded.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: ({ input: { id }, context }) => moveInvoice({ context, id, to: "VOID" }),
});
