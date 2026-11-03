import { describe, expect, it } from "vitest";
import { notificationsOf, readingMember } from "./notification-helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

describe("ticket create notifications (ADR 0094)", () => {
  it("tells the assignee a ticket was created with", async () => {
    const { context, type, customer } = await ticketSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId: anna,
    });
    const { items } = await notificationsOf({ context, userId: anna });
    expect(items.map((item) => [item.kind, item.ticketId])).toEqual([["ASSIGNED", ticket.id]]);
  });
});
