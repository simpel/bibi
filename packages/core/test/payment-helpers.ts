import {
  createDeposit,
  createMemoryPaymentProvider,
  type ExecuteContext,
  execute,
  type MemoryPaymentProvider,
  sendDeposit,
  setPaymentProvider,
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../src/index";
import { unwrap } from "./helpers";
import { installFakeGateway } from "./payment-account-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

export type ActivateInput = { context: ExecuteContext };

/** Onboards the organization through the real operations with Stripe faked as ACTIVE. */
export async function activatePaymentAccount({ context }: ActivateInput) {
  const gateway = installFakeGateway();
  gateway.accountStatus = "ACTIVE";
  unwrap({ result: await execute({ operation: startPaymentOnboarding, input: {}, context }) });
  return unwrap({ result: await execute({ operation: syncPaymentAccount, input: {}, context }) });
}

export type SentDepositInput = { context: ExecuteContext; orderId: string; amountMinor?: number };

/** A SENT deposit request on the order that payments can be requested against (ADR 0057). */
export async function sentDeposit({
  context,
  orderId,
  amountMinor = 1_000_000,
}: SentDepositInput) {
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
  provider: MemoryPaymentProvider;
}> {
  const { context, type, customer } = await orderSetup();
  const order = await createTestOrder({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  const account = await activatePaymentAccount({ context });
  const provider = createMemoryPaymentProvider();
  setPaymentProvider({ provider });
  const deposit = await sentDeposit({ context, orderId: order.id });
  const ids = { orderId: order.id, depositId: deposit.id, customerId: customer.id };
  return { context, ...ids, account, provider };
}
