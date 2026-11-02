import { defineOperation } from "../../operations/define-operation";
import { chargeAfterCommit } from "./charge-after-commit";
import { insertPayment } from "./insert-payment";
import { PaymentCreateInputSchema, PaymentSchema } from "./schema";

export const createPayment = defineOperation({
  name: "payment.create",
  kind: "command",
  description:
    "Request a payment from the ticket's customer against one receivable (ADR 0057): a SENT " +
    "or ACCEPTED quote (quoteId), a SENT deposit request (depositId) or a SENT invoice " +
    "(invoiceId). The amount defaults to its open balance and may be lower for a partial " +
    "payment. Charged directly on the organization's Stripe account. CARD returns a hosted " +
    "checkout link (paymentUrl) to send to the customer; INVOICE emails a Stripe invoice to the " +
    "customer's email. Needs an ACTIVE payment account. The payment starts PENDING and is " +
    "updated when Stripe reports it paid; if Stripe refuses the charge it is FAILED.",
  input: PaymentCreateInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: ({ input, context }) => insertPayment({ context, input }),
  external: chargeAfterCommit,
});
