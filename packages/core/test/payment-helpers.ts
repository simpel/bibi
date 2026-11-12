import {
  createDeposit,
  type ExecuteContext,
  execute,
  type MemoryProvider,
  sendDeposit,
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../src/index";
import { unwrap } from "./helpers";
import { connectLedger } from "./ledger-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";
import { installFakeGateway } from "./payment-account-helpers";

export type ActivateInput = {
  context: ExecuteContext;
  /** Connect the memory accounting system (default); false when the test connects its own. */
  ledger?: boolean;
};

/**
 * Onboards the organization through the real operations with the operator faked as ACTIVE, and
 * connects a memory accounting system for invoices (ADR 0106).
 */
export async function activatePaymentAccount({ context, ledger = true }: ActivateInput) {
  const gateway = installFakeGateway();
  gateway.accountStatus = "ACTIVE";
  unwrap({ result: await execute({ operation: startPaymentOnboarding, input: {}, context }) });
  const account = unwrap({
    result: await execute({ operation: syncPaymentAccount, input: {}, context }),
  });
  // Money needs an accounting system that issues the documents (ADR 0106).
  const books = ledger ? await connectLedger({ context }) : null;
  return { ...account, provider: gateway, ledger: books };
}

export type SentDepositInput = { context: ExecuteContext; orderId: string; amountMinor?: number };

/** A SENT deposit request on the order that payments can be requested against (ADR 0057). */
export async function sentDeposit({ context, orderId, amountMinor = 1_000_000 }: SentDepositInput) {
  const input = { orderId, description: "Advance", amountMinor };
  const draft = unwrap({ result: await execute({ operation: createDeposit, input, context }) });
  const sent = await execute({ operation: sendDeposit, input: { id: draft.id }, context });
  return unwrap({ result: sent });
}

/**
 * An order at an organization whose payment account is active, with an in-memory provider and a
 * SENT deposit request of 10 000 kr to pay against.
 */
export async function paymentSetup(): Promise<{
  context: ExecuteContext;
  orderId: string;
  depositId: string;
  customerId: string;
  account: { stripeAccountId: string | null };
  provider: MemoryProvider;
}> {
  const { context, type, customer } = await orderSetup();
  const order = await createTestOrder({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  const { provider, ...account } = await activatePaymentAccount({ context });
  const deposit = await sentDeposit({ context, orderId: order.id });
  const ids = { orderId: order.id, depositId: deposit.id, customerId: customer.id };
  return { context, ...ids, account, provider };
}
