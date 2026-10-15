import {
  createMemoryPaymentProvider,
  type ExecuteContext,
  execute,
  type MemoryPaymentProvider,
  setPaymentProvider,
  startPaymentOnboarding,
  syncPaymentAccount,
} from "../src/index";
import { bookingSetup, createTestBooking } from "./booking-helpers";
import { unwrap } from "./helpers";
import { installFakeGateway } from "./payment-account-helpers";

export type ActivateInput = { context: ExecuteContext };

/** Onboards the organization through the real operations with Stripe faked as ACTIVE. */
export async function activatePaymentAccount({ context }: ActivateInput) {
  const gateway = installFakeGateway();
  gateway.accountStatus = "ACTIVE";
  unwrap({ result: await execute({ operation: startPaymentOnboarding, input: {}, context }) });
  return unwrap({ result: await execute({ operation: syncPaymentAccount, input: {}, context }) });
}

/** A booking at an organization whose payment account is active, with an in-memory provider. */
export async function paymentSetup(): Promise<{
  context: ExecuteContext;
  bookingId: string;
  customerId: string;
  account: { stripeAccountId: string | null };
  provider: MemoryPaymentProvider;
}> {
  const { context, type, customer } = await bookingSetup();
  const booking = await createTestBooking({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
  });
  const account = await activatePaymentAccount({ context });
  const provider = createMemoryPaymentProvider();
  setPaymentProvider({ provider });
  return { context, bookingId: booking.id, customerId: customer.id, account, provider };
}
