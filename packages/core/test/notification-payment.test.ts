import { afterEach, describe, expect, it } from "vitest";
import {
  applyPaymentSignal,
  createExecuteContext,
  execute,
  listNotifications,
  PRESET_PERMISSIONS,
  resetProviderAdapters,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { makeReaders, notificationsOf } from "./notification-helpers";
import { pendingPayment } from "./stripe-webhook-helpers";

afterEach(() => {
  resetProviderAdapters();
});

describe("payment notifications (ADR 0094)", () => {
  it("tells the order's assignee once when a payment succeeds", async () => {
    const { context, account, payment, orderId } = await pendingPayment({ coordinated: true });
    const main = await context.db.assignment.findFirstOrThrow({
      where: { recordId: orderId, responsibilityId: null },
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
      provider: "STRIPE" as const,
      eventId: "evt_paid",
      kind: "attempt.succeeded" as const,
      externalAccountId: account,
      reference: payment.providerReference,
      occurredAt: new Date(),
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
    expect(data?.orderReference).toBe(items[0]?.data.orderReference);
  });
});
