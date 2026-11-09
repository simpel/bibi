import type { Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";
import { moveReceivable } from "../payment/move-receivable";
import { receivableMoveDates } from "../payment/receivable-lifecycle";
import type { ReceivableStatus } from "../payment/settlement-schema";
import type { InvoiceDto } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

export type MoveInvoiceInput = {
  context: Pick<OperationContext, "db" | "recordChange" | "now">;
  id: string;
  to: ReceivableStatus;
};

/** The one place an invoice's status changes (`moveReceivable`, ADR 0057). */
export const moveInvoice = ({ context, id, to }: MoveInvoiceInput): Promise<Result<InvoiceDto>> =>
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
