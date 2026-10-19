import { afterEach, describe, expect, it } from "vitest";
import {
  createDeposit,
  createPayment,
  type ExecuteContext,
  execute,
  getDeposit,
  getTicketBalance,
  sendDeposit,
  setPaymentProvider,
  setStripeConnectGateway,
  voidDeposit,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { paymentSetup } from "./payment-helpers";
import { markSucceeded } from "./receivable-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

type PayInput = { context: ExecuteContext; depositId: string; amountMinor?: number };
const pay = ({ context, depositId, amountMinor }: PayInput) =>
  execute({ operation: createPayment, input: { depositId, method: "CARD", amountMinor }, context });

const read = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  unwrap({ result: await execute({ operation: getDeposit, input: { id }, context }) });

describe("a deposit request is a receivable payments settle (ADR 0057)", () => {
  it("defaults the amount to the open balance and derives progress from payments", async () => {
    const { context, depositId } = await paymentSetup();
    expect(await read({ context, id: depositId })).toMatchObject({
      status: "SENT",
      paidMinor: 0,
      openMinor: 1_000_000,
      progress: "OPEN",
    });
    const part = unwrap({ result: await pay({ context, depositId, amountMinor: 400_000 }) });
    await markSucceeded({ context, paymentId: part.id });
    expect(await read({ context, id: depositId })).toMatchObject({
      paidMinor: 400_000,
      openMinor: 600_000,
      progress: "PARTLY_PAID",
    });
    const tooMuch = await pay({ context, depositId, amountMinor: 700_000 });
    expect(errorCode({ result: tooMuch })).toBe("VALIDATION");
    const rest = unwrap({ result: await pay({ context, depositId }) });
    expect(rest.amountMinor).toBe(600_000);
    await markSucceeded({ context, paymentId: rest.id });
    expect((await read({ context, id: depositId })).progress).toBe("PAID");
    expect(errorCode({ result: await pay({ context, depositId }) })).toBe("CONFLICT");
    await markSucceeded({ context, paymentId: rest.id, refundedMinor: 100_000 });
    expect(await read({ context, id: depositId })).toMatchObject({ progress: "PARTLY_PAID" });
  });

  it("charges only a SENT deposit and names exactly one receivable", async () => {
    const { context, ticketId, depositId } = await paymentSetup();
    const input = { ticketId, description: "Advance", amountMinor: 50_000 };
    const draft = unwrap({ result: await execute({ operation: createDeposit, input, context }) });
    expect(draft).toMatchObject({ status: "DRAFT", progress: "OPEN" });
    expect(errorCode({ result: await pay({ context, depositId: draft.id }) })).toBe("CONFLICT");
    const none = await execute({ operation: createPayment, input: { method: "CARD" }, context });
    expect(errorCode({ result: none })).toBe("VALIDATION");
    const both = { method: "CARD" as const, depositId, invoiceId: draft.id };
    const two = await execute({ operation: createPayment, input: both, context });
    expect(errorCode({ result: two })).toBe("VALIDATION");
  });

  it("voids only without pending or paid money, and VOID is final", async () => {
    const { context, depositId } = await paymentSetup();
    const pending = unwrap({ result: await pay({ context, depositId }) });
    const blocked = await execute({ operation: voidDeposit, input: { id: depositId }, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    await context.db.payment.update({ where: { id: pending.id }, data: { status: "FAILED" } });
    const voided = unwrap({
      result: await execute({ operation: voidDeposit, input: { id: depositId }, context }),
    });
    expect(voided.status).toBe("VOID");
    const resend = await execute({ operation: sendDeposit, input: { id: depositId }, context });
    expect(errorCode({ result: resend })).toBe("CONFLICT");
    expect(errorCode({ result: await pay({ context, depositId }) })).toBe("CONFLICT");
  });

  it("keeps deposits and balances per organization", async () => {
    const { context, ticketId, depositId } = await paymentSetup();
    const stranger = testContext();
    const get = await execute({
      operation: getDeposit,
      input: { id: depositId },
      context: stranger,
    });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const input = { ticketId, description: "Theirs", amountMinor: 50_000 };
    const create = await execute({ operation: createDeposit, input, context: stranger });
    expect(errorCode({ result: create })).toBe("NOT_FOUND");
    const sent = await execute({
      operation: sendDeposit,
      input: { id: depositId },
      context: stranger,
    });
    expect(errorCode({ result: sent })).toBe("NOT_FOUND");
    expect(errorCode({ result: await pay({ context: stranger, depositId }) })).toBe("NOT_FOUND");
    const balance = await execute({
      operation: getTicketBalance,
      input: { ticketId },
      context: stranger,
    });
    expect(errorCode({ result: balance })).toBe("NOT_FOUND");
  });
});
