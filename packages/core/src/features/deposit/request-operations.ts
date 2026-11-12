import { getLogger } from "@bibi/logger";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { chargeAfterCommit } from "../payment/charge-after-commit";
import { insertPayment } from "../payment/insert-payment";
import { loadChargeTarget } from "../payment/payment-preconditions";
import { PaymentSchema } from "../payment/schema";
import { issueDepositInProvider, ledgerRouteOf } from "./deposit-provider";
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
    "What the organization's deposit rule asks of an order (ADR 0090): a percentage of its " +
    "total incl. VAT (PERCENT), the whole total when it is below the minimum (FULL, paid in " +
    "full up front), or nothing when there is no rule (NONE). deposit.request uses it when no " +
    "amount is given.",
  input: DepositSuggestInputSchema,
  output: DepositSuggestionSchema,
  permission: "payment:read",
  handler: ({ input, context }) => suggestDeposit({ context, orderId: input.orderId }),
});

type AmountInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: DepositRequestInput;
};

/** The given amount, else the rule's; an order with neither is a VALIDATION error on the amount. */
async function requestedAmount({ context, input }: AmountInput): Promise<Result<number>> {
  if (input.amountMinor !== undefined) return ok({ value: input.amountMinor });
  const suggestion = await suggestDeposit({ context, orderId: input.orderId });
  if (!suggestion.ok) return suggestion;
  const amount = suggestion.value.amountMinor;
  if (amount !== null && amount >= 100) return ok({ value: amount });
  const message = "Give an amount: the deposit rule asks for nothing on this order";
  return invalid({ message, issues: [{ path: "amountMinor", message }] });
}

export const requestDeposit = defineOperation({
  name: "deposit.request",
  kind: "command",
  description:
    "Ask the order's customer for a deposit in one step (ADR 0090): creates a SENT deposit " +
    "request and a payment against it, and returns the payment with its link (paymentUrl) to " +
    "send to the customer. The amount defaults to the organization's deposit rule " +
    "(deposit.suggest). The customer pays through the organization's routed payment methods, " +
    "so a payment provider must be connected. When the INVOICE route goes to an accounting " +
    "system it is raised there as a prepayment invoice first, and the payment is booked on it " +
    "(ADR 0106).",
  input: DepositRequestInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    const target = await loadChargeTarget({ context, orderId: input.orderId, method: undefined });
    if (!target.ok) return err({ error: target.error });
    const amount = await requestedAmount({ context, input });
    if (!amount.ok) return amount;
    const route = await ledgerRouteOf({ context, orderId: input.orderId });
    if (!route.ok) return route;
    const at = nowOf({ context });
    const row = await context.db.deposit.create({
      data: {
        organizationId: context.organizationId,
        orderId: input.orderId,
        description: input.description,
        amountMinor: amount.value,
        vatRows: await depositVatRows({
          context,
          orderId: input.orderId,
          amountMinor: amount.value,
        }),
        dueDate: input.dueDate ?? null,
        ...{ status: "SENT", statusChangedAt: at, sentAt: at },
        ...(route.value ?? {}),
        createdBy: context.actor.userId,
      },
    });
    context.recordChange({ entityId: row.id, after: row });
    return insertPayment({ context, input: { depositId: row.id } });
  },
  external: async ({ output, context }) => {
    const depositId = output.depositId ?? "";
    // The payment link never waits on the ledger: an unraised deposit is raised before its
    // payment is booked there (registerOnInvoice).
    const issued = await issueDepositInProvider({ context, id: depositId });
    if (!issued.ok)
      getLogger().warn({ event: "deposit.issueFailed", depositId, err: issued.error });
    return chargeAfterCommit({
      input: { depositId: output.depositId ?? "" },
      output,
      context,
    });
  },
});
