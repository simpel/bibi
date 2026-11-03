import { afterEach, describe, expect, it } from "vitest";
import {
  applyPaymentSignal,
  createExecuteContext,
  execute,
  listNotifications,
  PRESET_PERMISSIONS,
  setPaymentProvider,
  setStripeConnectGateway,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { makeReaders, notificationsOf } from "./notification-helpers";
import { pendingPayment } from "./stripe-webhook-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

describe("payment notifications (ADR 0094)", () => {
  it("tells the ticket's assignee once when a payment succeeds", async () => {
    const { context, account, payment, ticketId } = await pendingPayment({ coordinated: true });
    const main = await context.db.assignment.findFirstOrThrow({
      where: { recordId: ticketId, responsibilityId: null },
    });
    const assigneeId = main.assigneeId ?? "";
    await makeReaders({ context, userIds: [assigneeId] });
    const system = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: { payment: ["write"] },
      actor: { type: "system", userId: null },
    });
    const signal = {
      kind: "paid" as const,
      providerAccountId: account,
      providerReference: payment.providerReference,
    };
    for (const _ of [1, 2]) {
      unwrap({
        result: await execute({ operation: applyPaymentSignal, input: signal, context: system }),
      });
    }
    const { items } = await notificationsOf({ context, userId: assigneeId });
    expect(items.map((item) => item.kind)).toEqual(["PAYMENT_RECEIVED"]);
    expect(items[0]).toMatchObject({ paymentId: payment.id, actorUserId: null });
    expect(items[0]?.data).toMatchObject({ amountMinor: 125_000, currency: "SEK" });
    // The snapshot is gated on read (ADR 0071): without payment:read the amount is gone.
    const { payment: _, ...permissions } = PRESET_PERMISSIONS.member;
    const blind = testContext({
      organizationId: context.organizationId,
      permissions,
      actor: { type: "user", userId: assigneeId },
    });
    const list = await execute({
      operation: listNotifications,
      input: { limit: 5 },
      context: blind,
    });
    const data = unwrap({ result: list }).items[0]?.data;
    expect(data?.amountMinor).toBeUndefined();
    expect(data?.ticketReference).toBe(items[0]?.data.ticketReference);
  });
});
