import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { resolveRoute } from "../../providers/resolve-route";
import { nowOf } from "../../time/now";
import { moveReceivable } from "../payment/move-receivable";
import { receivableMoveDates } from "../payment/receivable-lifecycle";
import type { ReceivableStatus } from "../payment/settlement-schema";
import { raisedInProvider } from "./invoice-provider";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { syncWithProvider } from "./sync-operation";
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
    "Mark a DRAFT invoice as SENT to the customer; it becomes what the order owes. It is " +
    "raised where the INVOICE route says (ADR 0090, 0100): in the venue's invoicing system, " +
    "e.g. Fortnox (created, booked and emailed there; payments are mirrored back), or kept in " +
    "Bibi for payments requested through the payment operator (payment.create). Any other " +
    "starting status is a CONFLICT.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input: { id }, context }) => {
    const route = await resolveRoute({ context, method: "INVOICE" });
    if (!route.ok) return route;
    const sent = await moveInvoice({ context, id, to: "SENT" });
    if (!sent.ok || route.value === null) return sent;
    const { provider, connection } = route.value;
    await context.db.invoice.update({
      where: { id },
      data: { provider, connectionId: connection.id },
    });
    return ok({ value: { ...sent.value, provider } });
  },
  // The provider only after the commit (ADR 0058); a failure leaves it SENT without a document
  // number, and invoice.sync raises it again.
  external: ({ output, context }) =>
    raisedInProvider({ invoice: output })
      ? syncWithProvider({ context, invoice: output })
      : Promise.resolve(ok({ value: output })),
});

export const voidInvoice = defineOperation({
  name: "invoice.void",
  kind: "command",
  description:
    "Void a DRAFT or SENT invoice: it is no longer owed and the order can be invoiced again. " +
    "Refused (CONFLICT) while a payment against it is PENDING or anything paid against it has " +
    "not been refunded.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: ({ input: { id }, context }) => moveInvoice({ context, id, to: "VOID" }),
});
