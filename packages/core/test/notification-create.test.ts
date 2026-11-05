import { describe, expect, it } from "vitest";
import { notificationsOf, readingMember } from "./notification-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

describe("order create notifications (ADR 0094)", () => {
  it("tells the assignee an order was created with", async () => {
    const { context, type, customer } = await orderSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId: anna,
    });
    const { items } = await notificationsOf({ context, userId: anna });
    expect(items.map((item) => [item.kind, item.orderId])).toEqual([["ASSIGNED", order.id]]);
  });
});
