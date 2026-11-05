import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { moveReceivable } from "../payment/move-receivable";
import { loadChargeableOrder } from "../payment/payment-preconditions";
import { receivableMoveDates } from "../payment/receivable-lifecycle";
import type { ReceivableStatus } from "../payment/settlement-schema";
import { depositVatRows } from "./deposit-vat";
import {
  DepositCreateInputSchema,
  type DepositDto,
  DepositIdInputSchema,
  DepositSchema,
} from "./schema";
import { loadDeposit } from "./to-deposit-dto";

export const createDeposit = defineOperation({
  name: "deposit.create",
  kind: "command",
  description:
    "Create a DRAFT deposit request on an order: a fixed amount with its own description, e.g. " +
    "an advance at confirmation. Send it (deposit.send) before requesting a payment against it " +
    "(payment.create with depositId). The order must not be in a closing status unless it is " +
    "invoiceable.",
  input: DepositCreateInputSchema,
  output: DepositSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const order = await loadChargeableOrder({ context, orderId: input.orderId });
    if (!order.ok) return order;
    const { orderId, amountMinor } = input;
    const row = await context.db.deposit.create({
      data: {
        organizationId: context.organizationId,
        orderId,
        description: input.description,
        amountMinor,
        vatRows: await depositVatRows({ context, orderId, amountMinor }),
        dueDate: input.dueDate ?? null,
        createdBy: context.actor.userId,
      },
    });
    context.recordChange({ entityId: row.id, after: row });
    const deposit = await loadDeposit({ context, id: row.id });
    return deposit ? ok({ value: deposit }) : notFound({ entity: "Deposit" });
  },
});

type MoveInput = {
  context: Pick<OperationContext, "db" | "recordChange" | "now">;
  id: string;
  to: ReceivableStatus;
};

const moveDeposit = ({ context, id, to }: MoveInput): Promise<Result<DepositDto>> =>
  moveReceivable({
    context,
    kind: "deposit",
    id,
    to,
    load: () => loadDeposit({ context, id }),
    claim: async ({ from, to }) =>
      (
        await context.db.deposit.updateMany({
          where: { id, status: from },
          data: { status: to, ...receivableMoveDates({ to, at: nowOf({ context }) }) },
        })
      ).count,
  });

export const sendDeposit = defineOperation({
  name: "deposit.send",
  kind: "command",
  description:
    "Mark a DRAFT deposit request as SENT to the customer; payments can then be requested " +
    "against it. Any other starting status is a CONFLICT.",
  input: DepositIdInputSchema,
  output: DepositSchema,
  permission: "payment:write",
  handler: ({ input: { id }, context }) => moveDeposit({ context, id, to: "SENT" }),
});

export const voidDeposit = defineOperation({
  name: "deposit.void",
  kind: "command",
  description:
    "Void a DRAFT or SENT deposit request: it is no longer owed. Refused (CONFLICT) while a " +
    "payment against it is PENDING or anything paid against it has not been refunded.",
  input: DepositIdInputSchema,
  output: DepositSchema,
  permission: "payment:write",
  handler: ({ input: { id }, context }) => moveDeposit({ context, id, to: "VOID" }),
});
