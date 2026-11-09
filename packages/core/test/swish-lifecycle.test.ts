import { describe, expect, it } from "vitest";
import {
  createPayment,
  type ExecuteContext,
  execute,
  receiveProviderWebhook,
  refundPayment,
  startPublicAttempt,
} from "../src/index";
import { swishInstructionId } from "../src/providers/swish/swish-format";
import { unwrap } from "./helpers";
import { paymentSetup } from "./payment-helpers";
import {
  connectSwish,
  paymentRequest,
  type SwishStub,
  stubSwish,
  useSwishEnv,
} from "./swish-helpers";

useSwishEnv();

const callback = ({ body }: { body: unknown }) =>
  receiveProviderWebhook({
    provider: "SWISH",
    request: new Request("https://bibi.test/api/providers/swish/webhook", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  });

const statusOf = async ({ result }: { result: ReturnType<typeof callback> }) =>
  unwrap({ result: await result }).status;

type PaidSetup = {
  context: ExecuteContext;
  stub: SwishStub;
  paymentId: string;
  number: string;
  requestId: string;
};

/** A payment paid with Swish: requested at the pay page, then a callback Bibi re-reads. */
async function paidWithSwish(): Promise<PaidSetup> {
  const { context, depositId } = await paymentSetup();
  const stub = stubSwish();
  const number = (await connectSwish({ context, stub })).externalAccountId ?? "";
  const input = { depositId, amountMinor: 100_000 };
  const payment = unwrap({ result: await execute({ operation: createPayment, input, context }) });
  const { publicToken: token } = await context.db.payment.findUniqueOrThrow({
    where: { id: payment.id },
  });
  stub.route = () => ({ status: 201, headers: { paymentrequesttoken: "qr-token" } });
  const attempt = unwrap({ result: await startPublicAttempt({ token, method: "SWISH" }) });
  expect(attempt).toMatchObject({ provider: "SWISH", qrToken: "qr-token" });
  const requestId = swishInstructionId({ key: `bibi-attempt-${attempt.id}` });
  const paid = paymentRequest({
    id: requestId,
    payeeAlias: number,
    status: "PAID",
    amount: "1000.00",
    payeePaymentReference: payment.id,
    paymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
  });
  stub.route = () => ({ json: paid });
  const applied = await statusOf({ result: callback({ body: paid }) });
  expect(applied).toBe("applied");
  return { context, stub, paymentId: payment.id, number, requestId };
}

describe("Swish through the core operations (ADR 0100)", () => {
  it("settles a payment from a callback only after reading it again from Swish", async () => {
    const { context, stub, paymentId, number, requestId } = await paidWithSwish();
    expect(stub.calls.at(-1)).toMatchObject({
      method: "GET",
      url: `https://mss.swish.test/swish-cpcapi/api/v1/paymentrequests/${requestId}`,
    });
    const paid = await context.db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(paid).toMatchObject({ status: "SUCCEEDED", method: "SWISH", provider: "SWISH" });
    const again = await statusOf({
      result: callback({ body: { id: requestId, payeeAlias: number, status: "PAID" } }),
    });
    expect(again).toBe("duplicate");
  });

  it("ignores a forged callback whose request Swish still reports as CREATED", async () => {
    const { context, depositId } = await paymentSetup();
    const stub = stubSwish();
    const number = (await connectSwish({ context, stub })).externalAccountId ?? "";
    const id = swishInstructionId({ key: "forged" });
    stub.route = () => ({ json: paymentRequest({ id, payeeAlias: number, status: "CREATED" }) });
    const forged = await statusOf({
      result: callback({ body: { id, payeeAlias: number, status: "PAID", amount: 1000 } }),
    });
    expect(forged).toBe("ignored");
    const unknown = await statusOf({
      result: callback({ body: { id, payeeAlias: "1239999999", status: "PAID" } }),
    });
    expect(unknown).toBe("ignored");
    expect(depositId).toBeTruthy();
  });

  it("refunds at Swish and completes the refund from its callback", async () => {
    const { context, stub, paymentId, number, requestId } = await paidWithSwish();
    stub.route = (request) =>
      request.method === "GET"
        ? {
            json: paymentRequest({
              id: requestId,
              payeeAlias: number,
              status: "PAID",
              paymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
            }),
          }
        : { status: 201 };
    const pending = unwrap({
      result: await execute({
        operation: refundPayment,
        input: { id: paymentId, amountMinor: 40_000 },
        context,
      }),
    });
    expect(pending.refundedMinor).toBe(0);
    const row = await context.db.paymentRefund.findFirstOrThrow({ where: { paymentId } });
    const refundId = row.providerReference ?? "";
    expect(refundId).toBe(swishInstructionId({ key: `bibi-refund-${row.id}` }));
    const refund = {
      id: refundId,
      originalPaymentReference: "1E2FC19E5E5E4E18916609B7F8911C12",
      payerAlias: number,
      payerPaymentReference: paymentId,
      amount: "400.00",
      currency: "SEK",
    };
    stub.route = () => ({ json: { ...refund, status: "PAID", datePaid: "2026-11-09T11:00:00Z" } });
    const applied = await statusOf({ result: callback({ body: { ...refund, status: "PAID" } }) });
    expect(applied).toBe("applied");
    const done = await context.db.paymentRefund.findUniqueOrThrow({ where: { id: row.id } });
    expect(done.status).toBe("SUCCEEDED");
  });
});

describe("Swish refunds that Swish may or may not have made (ADR 0100)", () => {
  const original = "1E2FC19E5E5E4E18916609B7F8911C12";

  /** Swish answers the original as PAID and the refund PUT with `put`. */
  const answer = ({ setup, put }: { setup: PaidSetup; put: () => Partial<{ status: number }> }) => {
    setup.stub.route = (request) => {
      if (request.method === "PUT") return put();
      const request_ = { id: setup.requestId, payeeAlias: setup.number, status: "PAID" };
      return { json: paymentRequest({ ...request_, paymentReference: original }) };
    };
  };

  const refundOnce = ({ setup, amountMinor }: { setup: PaidSetup; amountMinor: number }) =>
    execute({
      operation: refundPayment,
      input: { id: setup.paymentId, amountMinor },
      context: setup.context,
    });

  it("keeps a refund whose call timed out PENDING with its reference, never sent twice", async () => {
    const setup = await paidWithSwish();
    answer({
      setup,
      put: () => {
        throw new Error("socket hang up");
      },
    });
    const first = await refundOnce({ setup, amountMinor: 40_000 });
    expect(first.ok).toBe(false);
    const row = await setup.context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: setup.paymentId },
    });
    const refundRef = swishInstructionId({ key: `bibi-refund-${row.id}` });
    expect(row).toMatchObject({ status: "PENDING", providerReference: refundRef });

    // A second refund sends only its own refund, never the first one again.
    answer({ setup, put: () => ({ status: 201 }) });
    unwrap({ result: await refundOnce({ setup, amountMinor: 10_000 }) });
    const puts = setup.stub.calls.filter((call) => call.method === "PUT");
    expect(puts.filter((call) => call.url.endsWith(refundRef))).toHaveLength(1);

    // Swish did make the first: its callback completes it by the stored reference.
    const refund = {
      id: refundRef,
      originalPaymentReference: original,
      payerAlias: setup.number,
      amount: "400.00",
    };
    setup.stub.route = () => ({ json: { ...refund, status: "PAID" } });
    expect(await statusOf({ result: callback({ body: { ...refund, status: "PAID" } }) })).toBe(
      "applied",
    );
    const done = await setup.context.db.paymentRefund.findUniqueOrThrow({ where: { id: row.id } });
    expect(done.status).toBe("SUCCEEDED");
  });

  it("marks a refund Swish refused FAILED, so it can be refunded again", async () => {
    const setup = await paidWithSwish();
    answer({ setup, put: () => ({ status: 422 }) });
    const refused = await refundOnce({ setup, amountMinor: 40_000 });
    expect(refused.ok).toBe(false);
    const row = await setup.context.db.paymentRefund.findFirstOrThrow({
      where: { paymentId: setup.paymentId },
    });
    expect(row.status).toBe("FAILED");
  });
});
