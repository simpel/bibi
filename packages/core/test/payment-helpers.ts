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
import { createTestTicket, ticketSetup } from "./ticket-helpers";

export type ActivateInput = { context: ExecuteContext };

/** Onboards the organization through the real operations with Stripe faked as ACTIVE. */
export async function activatePaymentAccount({ context }: ActivateInput) {
  const gateway = installFakeGateway();
  gateway.accountStatus = "ACTIVE";
  unwrap({ result: await execute({ operation: startPaymentOnboarding, input: {}, context }) });
  return unwrap({ result: await execute({ operation: syncPaymentAccount, input: {}, context }) });
}

export type SentDepositInput = { context: ExecuteContext; ticketId: string; amountMinor?: number };

/** A SENT deposit request on the ticket that payments can be requested against (ADR 0057). */
export async function sentDeposit({
  context,
  ticketId,
  amountMinor = 1_000_000,
}: SentDepositInput) {
  const input = { ticketId, description: "Advance", amountMinor };
  const draft = unwrap({ result: await execute({ operation: createDeposit, input, context }) });
  const sent = await execute({ operation: sendDeposit, input: { id: draft.id }, context });
  return unwrap({ result: sent });
}

/**
 * A ticket at an organization whose payment account is active, with an in-memory provider and a
 * SENT deposit request of 10 000 kr to pay against.
 */
export async function paymentSetup(): Promise<{
  context: ExecuteContext;
  ticketId: string;
  depositId: string;
  customerId: string;
  account: { stripeAccountId: string | null };
  provider: MemoryPaymentProvider;
}> {
  const { context, type, customer } = await ticketSetup();
  const ticket = await createTestTicket({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  const account = await activatePaymentAccount({ context });
  const provider = createMemoryPaymentProvider();
  setPaymentProvider({ provider });
  const deposit = await sentDeposit({ context, ticketId: ticket.id });
  const ids = { ticketId: ticket.id, depositId: deposit.id, customerId: customer.id };
  return { context, ...ids, account, provider };
}
