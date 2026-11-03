import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { chargeAfterCommit } from "../payment/charge-after-commit";
import { insertPayment } from "../payment/insert-payment";
import { loadChargeTarget } from "../payment/payment-preconditions";
import { PaymentSchema } from "../payment/schema";
import { suggestDeposit } from "./deposit-rule";
import { depositVatRows } from "./deposit-vat";
import {
  type DepositRequestInput,
  DepositRequestInputSchema,
  DepositSuggestInputSchema,
  DepositSuggestionSchema,
} from "./schema";

export const suggestDepositAmount = defineOperation({
  name: "deposit.suggest",
  kind: "query",
  description:
    "What the organization's deposit rule asks of a ticket (ADR 0090): a percentage of its " +
    "total incl. VAT (PERCENT), the whole total when it is below the minimum (FULL, paid in " +
    "full up front), or nothing when there is no rule (NONE). deposit.request uses it when no " +
    "amount is given.",
  input: DepositSuggestInputSchema,
  output: DepositSuggestionSchema,
  permission: "payment:read",
  handler: ({ input, context }) => suggestDeposit({ context, ticketId: input.ticketId }),
});

type AmountInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: DepositRequestInput;
};

/** The given amount, else the rule's; a ticket with neither is a VALIDATION error on the amount. */
async function requestedAmount({ context, input }: AmountInput): Promise<Result<number>> {
  if (input.amountMinor !== undefined) return ok({ value: input.amountMinor });
  const suggestion = await suggestDeposit({ context, ticketId: input.ticketId });
  if (!suggestion.ok) return suggestion;
  const amount = suggestion.value.amountMinor;
  if (amount !== null && amount >= 100) return ok({ value: amount });
  const message = "Give an amount: the deposit rule asks for nothing on this ticket";
  return invalid({ message, issues: [{ path: "amountMinor", message }] });
}

export const requestDeposit = defineOperation({
  name: "deposit.request",
  kind: "command",
  description:
    "Ask the ticket's customer for a deposit in one step (ADR 0090): creates a SENT deposit " +
    "request and a CARD payment against it, and returns the payment with its /pay link " +
    "(paymentUrl) to send to the customer. The amount defaults to the organization's deposit " +
    "rule (deposit.suggest). The customer pays the organization's own Stripe account, so it " +
    "needs an ACTIVE payment account.",
  input: DepositRequestInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const target = await loadChargeTarget({ context, ticketId: input.ticketId, method: "CARD" });
    if (!target.ok) return err({ error: target.error });
    const amount = await requestedAmount({ context, input });
    if (!amount.ok) return amount;
    const at = nowOf({ context });
    const row = await context.db.deposit.create({
      data: {
        organizationId: context.organizationId,
        ticketId: input.ticketId,
        description: input.description,
        amountMinor: amount.value,
        vatRows: await depositVatRows({
          context,
          ticketId: input.ticketId,
          amountMinor: amount.value,
        }),
        dueDate: input.dueDate ?? null,
        ...{ status: "SENT", statusChangedAt: at, sentAt: at },
        createdBy: context.actor.userId,
      },
    });
    context.recordChange({ entityId: row.id, after: row });
    return insertPayment({ context, input: { depositId: row.id, method: "CARD" } });
  },
  external: ({ output, context }) =>
    chargeAfterCommit({
      input: { depositId: output.depositId ?? "", method: "CARD" },
      output,
      context,
    }),
});
