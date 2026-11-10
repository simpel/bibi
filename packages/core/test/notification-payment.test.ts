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

  it("keeps money a second attempt took on a paid payment and tells staff it is over-paid", async () => {
    const { context, account, payment, orderId } = await pendingPayment({ coordinated: true });
    const main = await context.db.assignment.findFirstOrThrow({
      where: { recordId: orderId, responsibilityId: null },
    });
    const assigneeId = main.assigneeId ?? "";
    await makeReaders({ context, userIds: [assigneeId] });
    const row = await context.db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    const second = await context.db.paymentAttempt.create({
      data: {
        organizationId: context.organizationId,
        paymentId: payment.id,
        method: "CARD",
        provider: "STRIPE",
        connectionId: row.connectionId,
        providerReference: `cs_second_${payment.id}`,
      },
    });
    const system = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: { payment: ["write"] },
      actor: { type: "system", userId: null },
    });
    const paid = ({ reference }: { reference: string }) =>
      execute({
        operation: applyPaymentSignal,
        input: {
          provider: "STRIPE" as const,
          eventId: `evt_${reference}`,
          kind: "attempt.succeeded" as const,
          externalAccountId: account,
          reference,
          occurredAt: new Date(),
        },
        context: system,
      });
    unwrap({ result: await paid({ reference: payment.providerReference }) });
    // The first success closed the other open attempt.
    const closed = await context.db.paymentAttempt.findUniqueOrThrow({ where: { id: second.id } });
    expect(closed.status).toBe("CANCELLED");
    const again = unwrap({ result: await paid({ reference: `cs_second_${payment.id}` }) });
    expect(again).toMatchObject({ overpaid: true, changed: true, status: "SUCCEEDED" });
    const kept = await context.db.paymentAttempt.findUniqueOrThrow({ where: { id: second.id } });
    expect(kept.status).toBe("SUCCEEDED");
    const { items } = await notificationsOf({ context, userId: assigneeId });
    expect(items.map((item) => item.data.overpaid ?? false).sort()).toEqual([false, true]);
  });
});
