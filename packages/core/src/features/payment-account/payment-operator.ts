import type { PaymentAccount } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { PaymentOperator } from "./settings-schema";
import { loadPaymentSettings } from "./settings-store";

type Db = { context: Pick<OperationContext, "db"> };

/** Whether a Stripe account can take card payments now. */
export function stripeIsActive({ account }: { account: PaymentAccount | null }): boolean {
  return (
    account?.status === "ACTIVE" && Boolean(account.stripeAccountId) && !account.disconnectedAt
  );
}

export type ResolvedOperator = { operator: "STRIPE"; account: PaymentAccount };

/**
 * The payment operator a new payment goes through (ADR 0090): the admin's choice in the payment
 * settings, else the one that is connected. A chosen operator that is not connected is a
 * conflict, never a silent switch to another one.
 */
export async function resolvePaymentOperator({ context }: Db): Promise<Result<ResolvedOperator>> {
  const [settings, account] = await Promise.all([
    loadPaymentSettings({ context }),
    context.db.paymentAccount.findFirst({}),
  ]);
  const chosen: PaymentOperator | null = settings.paymentOperator;
  if (account && stripeIsActive({ account }) && (chosen === null || chosen === "STRIPE")) {
    return ok({ value: { operator: "STRIPE", account } });
  }
  return conflict({
    message: chosen
      ? `Payments go to ${chosen}, but it is not connected. Connect it in Administration → Integrations.`
      : "No payment operator is connected. Connect Stripe in Administration → Integrations.",
  });
}
