import { afterEach, describe, expect, it } from "vitest";
import { newPublicToken } from "../src/features/payment/public-token";
import {
  createMemoryProvider,
  createPayment,
  type ExecuteContext,
  execute,
  getPublicPayment,
  resetProviderAdapters,
  setProviderAdapter,
  startPublicAttempt,
  updatePaymentSettings,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { sendSignal } from "./lifecycle-helpers";
import { paymentSetup } from "./payment-helpers";

afterEach(() => {
  resetProviderAdapters();
});

/** An in-memory Swish whose requests start at the pay page, connected for the organization. */
async function connectSwish({ context }: { context: ExecuteContext }) {
  const fake = createMemoryProvider({
    key: "SWISH",
    connectKind: "HOSTED_ONBOARDING",
    methods: ["SWISH"],
    onDemand: true,
  });
  setProviderAdapter({ key: "SWISH", adapter: fake.adapter });
  await context.db.providerConnection.create({
    data: {
      organizationId: context.organizationId,
      provider: "SWISH",
      status: "CONNECTED",
      externalAccountId: `swish-${context.organizationId}`,
    },
  });
  return fake;
}

const tokenOf = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  (await context.db.payment.findUniqueOrThrow({ where: { id } })).publicToken;

describe("routing by method (ADR 0100)", () => {
  it("offers every routed method and starts Swish only from the pay page", async () => {
    const { context, depositId } = await paymentSetup();
    const swish = await connectSwish({ context });
    const input = { depositId, amountMinor: 100_000 };
    const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    expect(payment.method).toBe("CARD");
    const token = await tokenOf({ context, id: payment.id });
    const view = unwrap({ result: await getPublicPayment({ token }) });
    expect(view.methods).toEqual(["CARD", "SWISH"]);
    expect(swish.charges).toHaveLength(0);

    const started = unwrap({ result: await startPublicAttempt({ token, method: "SWISH" }) });
    expect(started).toMatchObject({
      method: "SWISH",
      provider: "SWISH",
      status: "PENDING",
      url: null,
    });
    expect(started.qrToken).toMatch(/^qr-sw_/);
    const again = unwrap({ result: await startPublicAttempt({ token, method: "SWISH" }) });
    expect(again.id).toBe(started.id);
    expect(swish.charges).toHaveLength(1);

    const reference = started.qrToken?.slice(3) ?? "";
    await sendSignal({
      context,
      provider: "SWISH",
      signal: { kind: "attempt.succeeded", reference },
    });
    const paid = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(paid).toMatchObject({ status: "SUCCEEDED", method: "SWISH", provider: "SWISH" });
    const closed = unwrap({ result: await getPublicPayment({ token }) });
    expect(closed.methods).toEqual([]);
    const late = await startPublicAttempt({ token, method: "CARD" });
    expect(errorCode({ result: late })).toBe("CONFLICT");
  });

  it("opens one attempt per method for concurrent starts", async () => {
    const { context, depositId } = await paymentSetup();
    const swish = await connectSwish({ context });
    const input = { depositId, amountMinor: 100_000 };
    const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    const token = await tokenOf({ context, id: payment.id });
    const both = await Promise.all([
      startPublicAttempt({ token, method: "SWISH" }),
      startPublicAttempt({ token, method: "SWISH" }),
    ]);
    const [a, b] = both.map((result) => unwrap({ result }));
    expect(a?.id).toBe(b?.id);
    const attempts = await context.db.paymentAttempt.count({
      where: { paymentId: payment.id, method: "SWISH" },
    });
    expect(attempts).toBe(1);
    expect(swish.charges).toHaveLength(1);
  });

  it("closes the card checkout when Swish pays, and refuses new attempts once paid", async () => {
    const { context, depositId, provider: card } = await paymentSetup();
    await connectSwish({ context });
    const input = { depositId, amountMinor: 1_000_000 };
    const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    const token = await tokenOf({ context, id: payment.id });
    const started = unwrap({ result: await startPublicAttempt({ token, method: "SWISH" }) });
    const reference = started.qrToken?.slice(3) ?? "";
    await sendSignal({
      context,
      provider: "SWISH",
      signal: { kind: "attempt.succeeded", reference },
    });
    expect(card.portCalls).toEqual([`cancel:${payment.providerReference}`]);
    const checkout = await context.db.paymentAttempt.findFirstOrThrow({
      where: { paymentId: payment.id, method: "CARD" },
    });
    expect(checkout.status).toBe("CANCELLED");

    // A second request for the same deposit cannot be paid once nothing is open on it.
    const other = await context.db.payment.create({
      data: {
        organizationId: context.organizationId,
        orderId: payment.orderId,
        depositId,
        method: "CARD",
        amountMinor: 1_000,
        currency: "SEK",
        publicToken: newPublicToken(),
      },
    });
    const late = await startPublicAttempt({ token: other.publicToken, method: "CARD" });
    expect(errorCode({ result: late })).toBe("CONFLICT");
  });

  it("prepares a Swish payment without an eager attempt", async () => {
    const { context, depositId } = await paymentSetup();
    const swish = await connectSwish({ context });
    const input = { depositId, amountMinor: 100_000, method: "SWISH" as const };
    const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
    expect(payment).toMatchObject({ method: "SWISH", provider: "SWISH", paymentUrl: null });
    expect(swish.charges).toHaveLength(0);
  });

  it("refuses a route the provider cannot take, and a route to one not connected", async () => {
    const { context, depositId } = await paymentSetup();
    const wrong = await execute({
      operation: updatePaymentSettings,
      input: { routes: [{ method: "SWISH", provider: "STRIPE" }] },
      context,
    });
    expect(errorCode({ result: wrong })).toBe("VALIDATION");
    const fake = createMemoryProvider({
      key: "SWISH",
      connectKind: "HOSTED_ONBOARDING",
      methods: ["SWISH", "CARD"],
    });
    setProviderAdapter({ key: "SWISH", adapter: fake.adapter });
    const routes = [{ method: "CARD" as const, provider: "SWISH" as const }];
    // Saving refuses a service that is not connected (the Payment methods page offers none).
    const notConnected = await execute({
      operation: updatePaymentSettings,
      input: { routes },
      context,
    });
    expect(errorCode({ result: notConnected })).toBe("CONFLICT");
    const { organizationId } = context;
    await context.db.providerConnection.upsert({
      where: { organizationId_provider: { organizationId, provider: "SWISH" } },
      create: {
        organizationId,
        provider: "SWISH",
        status: "CONNECTED",
        externalAccountId: `swish-${organizationId}`,
        connectedAt: new Date(),
      },
      update: { status: "CONNECTED", disconnectedAt: null },
    });
    const saved = unwrap({
      result: await execute({ operation: updatePaymentSettings, input: { routes }, context }),
    });
    expect(saved.routes).toContainEqual({ method: "CARD", provider: "SWISH" });
    expect(saved.paymentOperator).toBe("SWISH");
    // Disconnected later: never a silent switch to the connected card provider.
    await context.db.providerConnection.updateMany({
      where: { provider: "SWISH" },
      data: { status: "DISCONNECTED", disconnectedAt: new Date() },
    });
    const input = { depositId, amountMinor: 100_000 };
    const refused = await execute({ operation: createPayment, input, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
  });
});
