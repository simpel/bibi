import type { Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { moveReceivable } from "../payment/move-receivable";
import type { ReceivableStatus } from "../payment/settlement-schema";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type MoveInput = {
  context: Pick<OperationContext, "db" | "recordChange">;
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
          data: { status: to, statusChangedAt: new Date() },
        })
      ).count,
  });

export const sendInvoice = defineOperation({
  name: "invoice.send",
  kind: "command",
  description:
    "Mark a DRAFT invoice as SENT to the customer; payments can then be requested against it " +
    "and it becomes what the ticket owes. Any other starting status is a CONFLICT.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: ({ input: { id }, context }) => moveInvoice({ context, id, to: "SENT" }),
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
