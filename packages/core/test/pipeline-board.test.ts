import { describe, expect, it } from "vitest";
import { type ExecuteContext, execute, pipelineBoard } from "../src/index";
import { unwrap } from "./helpers";
import { testOrg } from "./org-helpers";
import { createTestTicket, memberUser, moveToStatus, ticketSetup } from "./ticket-helpers";

type BoardInput = { context: ExecuteContext; input?: Record<string, unknown> };

async function board({ context, input = {} }: BoardInput) {
  return unwrap({ result: await execute({ operation: pipelineBoard, input, context }) });
}

describe("pipeline.board (ADR 0043)", () => {
  it("has one column per status in order, closing statuses last as closed lanes", async () => {
    const { context } = await ticketSetup();
    const { columns } = await board({ context });
    expect(columns.map((column) => column.title)).toEqual([
      "Lead",
      "Confirmed",
      "Completed",
      "Lost",
    ]);
    expect(columns.filter((c) => c.closed).map((c) => c.title)).toEqual(["Completed", "Lost"]);
    expect(columns.find((c) => c.title === "Lost")?.statuses[0]?.requiresReason).toBe(true);
  });

  it("puts tickets in their status's column and moves them with ticket.changeStatus", async () => {
    const { context, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      estimatedHeadcount: 20,
    });
    const first = await board({ context });
    expect(first.cards).toEqual([
      expect.objectContaining({
        id: ticket.id,
        statusId: ticket.statusId,
        reference: ticket.reference,
        customerId: customer.id,
        quantity: 20,
        assigneeId: null,
      }),
    ]);
    const lost = { context, ticketId: ticket.id, name: "Lost", reason: "Went elsewhere" };
    const moved = unwrap({ result: await moveToStatus(lost) });
    const after = await board({ context });
    expect(after.cards[0]?.statusId).toBe(moved.statusId);
    const recent = await board({ context, input: { closedWithinDays: 1 } });
    expect(recent.cards).toHaveLength(1);
  });

  it("counts lines held and booked per card", async () => {
    const { context, type, customer } = await ticketSetup();
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const { cards } = await board({ context });
    expect(cards[0]).toMatchObject({ heldLines: 0, bookedLines: 0 });
  });

  it("filters by assignee", async () => {
    const { context, type, customer } = await ticketSetup();
    const sara = await memberUser({ context, name: "Sara" });
    const mine = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId: sara,
    });
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const filtered = await board({ context, input: { assigneeId: sara } });
    expect(filtered.cards.map((card) => card.id)).toEqual([mine.id]);
    expect(filtered.cards[0]).toMatchObject({ typeName: "Conference", assigneeId: sara });
  });

  it("never shows another organization's tickets", async () => {
    const { context, type, customer } = await ticketSetup();
    await createTestTicket({ context, entityTypeId: type.id, customerId: customer.id });
    const foreign = await testOrg();
    expect((await board({ context: foreign })).cards).toEqual([]);
  });
});
