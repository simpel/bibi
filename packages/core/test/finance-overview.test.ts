import { afterEach, describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  financeOverview,
  grantAll,
  setPaymentProvider,
  setStripeConnectGateway,
  updateOrder,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { halfPaidLateInvoice } from "./late-invoice-helpers";
import { moneySetup, sentTestQuote } from "./receivable-helpers";
import { createTestOrder, placeInStatus } from "./order-helpers";
import { statuses } from "./order-status-helpers";

afterEach(() => {
  setPaymentProvider({ provider: undefined });
  setStripeConnectGateway({ gateway: undefined });
});

const thisYear = () => {
  const year = new Date().getUTCFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
};

const overview = ({ context }: { context: ExecuteContext }) =>
  execute({ operation: financeOverview, input: thisYear(), context });

describe("finance.overview derives the organization's money (ADR 0077)", () => {
  it("adds up invoiced, received, open and overdue money", async () => {
    const { context } = await halfPaidLateInvoice();
    const value = unwrap({ result: await overview({ context }) });
    expect(value.monthly).toHaveLength(12);
    expect(value).toMatchObject({
      invoicedExclVatMinor: 500_000,
      receivedMinor: 180_000,
      outstandingMinor: 380_000,
      overdueMinor: 380_000,
      vatByRate: [{ vatRatePercent: 12, totalExclVatMinor: 500_000, vatMinor: 60_000 }],
    });
    expect(value.aging).toMatchObject({ overdue31to60Minor: 380_000, notDueMinor: 0 });
    expect(value.aging?.overdue[0]).toMatchObject({ daysOverdue: 40, openMinor: 380_000 });
    expect(value.revenueByType?.[0]?.invoicedExclVatMinor).toBe(500_000);
  });

  it("traces outstanding and overdue money over the range from invoices and payments", async () => {
    const { context } = await halfPaidLateInvoice();
    const { trends } = unwrap({ result: await overview({ context }) });
    expect(trends?.bucketSize).toBe("MONTH");
    expect(trends?.outstanding.current).toBe(380_000);
    expect(trends?.overdue.current).toBe(380_000);
    expect(trends?.invoiced.current).toBe(500_000);
    expect(trends?.received.previous).toBe(0);
  });

  it("splits closed orders into won (accepted quote) and lost, by month and value", async () => {
    const { context, order, customer } = await moneySetup();
    const closing = (await statuses({ context })).find((status) => status.closes);
    if (!closing) throw new Error("No closing status");
    await sentTestQuote({ context, orderId: order.id, accept: true });
    const entityTypeId = order.entityTypeId;
    const lost = await createTestOrder({ context, entityTypeId, customerId: customer.id });
    const estimate = { id: lost.id, estimatedValueMinor: 300_000 };
    unwrap({ result: await execute({ operation: updateOrder, input: estimate, context }) });
    const current = await context.db.order.findFirstOrThrow({ where: { id: order.id } });
    await placeInStatus({ order: current, statusId: closing.id });
    await placeInStatus({ order: lost, statusId: closing.id });
    const { outcomes } = unwrap({ result: await overview({ context }) });
    const total = ({
      key,
    }: {
      key: "wonOrders" | "wonValueMinor" | "lostOrders" | "lostValueMinor";
    }) => (outcomes ?? []).reduce((sum, row) => sum + row[key], 0);
    expect(outcomes).toHaveLength(12);
    expect([
      total({ key: "wonOrders" }),
      total({ key: "lostOrders" }),
      total({ key: "lostValueMinor" }),
    ]).toEqual([1, 1, 300_000]);
    expect(total({ key: "wonValueMinor" })).toBeGreaterThan(0);
  });

  it("hides the parts the caller may not read and stays in its organization", async () => {
    const { context } = await halfPaidLateInvoice();
    const permissions = { ...grantAll({}), payment: [], quote: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    const hidden = unwrap({ result: await overview({ context: blind }) });
    expect([hidden.monthly, hidden.aging, hidden.outcomes, hidden.trends]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    const stranger = unwrap({ result: await overview({ context: testContext() }) });
    expect([stranger.invoicedExclVatMinor, stranger.outstandingMinor]).toEqual([0, 0]);
    const member = testContext({ organizationId: context.organizationId, access: "read" });
    expect(errorCode({ result: await overview({ context: member }) })).toBe("FORBIDDEN");
  });

  it("refuses a period that runs backwards or is longer than 24 months", async () => {
    const context = testContext();
    const backwards = { from: "2026-05-01", to: "2026-04-01" };
    const long = { from: "2024-01-01", to: "2026-01-01" };
    for (const input of [backwards, long]) {
      const result = await execute({ operation: financeOverview, input, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });
});
