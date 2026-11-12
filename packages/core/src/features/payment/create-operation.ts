import { defineOperation } from "../../operations/define-operation";
import { chargeAfterCommit } from "./charge-after-commit";
import { insertPayment } from "./insert-payment";
import { PaymentCreateInputSchema, PaymentSchema } from "./schema";

export const createPayment = defineOperation({
  name: "payment.create",
  kind: "command",
  description:
    "Request a payment from the order's customer against one receivable (ADR 0057): a SENT " +
    "deposit request (depositId) or a SENT invoice (invoiceId); a quote is not paid directly, " +
    "accepting it leads to its deposit (ADR 0106). Needs a connected accounting system. The amount defaults to its open balance and may be lower for a partial " +
    "payment. The customer pays with any method routed to a connected provider (ADR 0100): a " +
    "card checkout link (paymentUrl) is prepared at once; a Swish request starts when the " +
    "customer opens the payment page. CONFLICT when no provider is connected for any method, " +
    "or the invoice is booked in an accounting system that cannot take the payment. The " +
    "payment starts PENDING and is updated when the provider reports it paid; if the provider " +
    "refuses the charge it is FAILED. To invoice, use invoice.send.",
  input: PaymentCreateInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: ({ input, context }) => insertPayment({ context, input }),
  external: chargeAfterCommit,
});
