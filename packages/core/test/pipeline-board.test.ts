import { describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  markInquiryLost,
  pipelineBoard,
  qualifyInquiry,
} from "../src/index";
import { createTestBooking, memberUser } from "./booking-helpers";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createTestInquiry, inquirySetup } from "./inquiry-helpers";
import { testOrg } from "./org-helpers";

type BoardInput = { context: ExecuteContext; input?: Record<string, unknown> };

async function board({ context, input = {} }: BoardInput) {
  return unwrap({ result: await execute({ operation: pipelineBoard, input, context }) });
}

describe("pipeline.board", () => {
  it("lays out inquiry stages, booking statuses by phase, then the closed lanes", async () => {
    const { context } = await inquirySetup();
    const { columns } = await board({ context });
    const ids = columns.map((column) => column.id);
    expect(ids.slice(0, 3)).toEqual(["inquiry:NEW", "inquiry:QUALIFIED", "inquiry:QUOTED"]);
    expect(ids.at(-1)).toBe("inquiry:LOST");
    const phases = columns.filter((c) => c.kind === "BOOKING").map((c) => c.phase);
    const closedStart = phases.indexOf("CANCELLED");
    expect(phases.slice(0, closedStart)).not.toContain("CANCELLED");
    expect(columns.filter((c) => c.closed).map((c) => c.id)).toContain("inquiry:LOST");
  });

  it("puts inquiries in their stage and moves them with the inquiry commands", async () => {
    const { context, type, customer } = await inquirySetup();
    const assigneeId = await memberUser({ context, name: "Sara" });
    const inquiry = await createTestInquiry({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const first = await board({ context });
    expect(first.cards).toEqual([
      expect.objectContaining({
        id: inquiry.id,
        kind: "INQUIRY",
        columnId: "inquiry:NEW",
        customerName: customer.name,
        quantity: 20,
        assigneeId: null,
      }),
    ]);
    unwrap({
      result: await execute({
        operation: qualifyInquiry,
        input: { id: inquiry.id, assigneeId },
        context,
      }),
    });
    const qualified = await board({ context });
    expect(qualified.cards[0]).toMatchObject({ columnId: "inquiry:QUALIFIED", assigneeId });
    unwrap({
      result: await execute({
        operation: markInquiryLost,
        input: { id: inquiry.id, lossReason: "Went elsewhere" },
        context,
      }),
    });
    expect((await board({ context })).cards[0]?.columnId).toBe("inquiry:LOST");
  });

  it("shows bookings in their status lane and filters by assignee", async () => {
    const { context, customer } = await inquirySetup();
    const { type } = await createTypeWithField({ context, base: "BOOKING", name: "Dinner" });
    const sara = await memberUser({ context, name: "Sara" });
    const mine = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
      assigneeId: sara,
    });
    const other = await createTestBooking({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const all = await board({ context });
    const byId = new Map(all.cards.map((card) => [card.id, card]));
    expect(byId.get(mine.id)).toMatchObject({
      kind: "BOOKING",
      columnId: `booking:${mine.bookingStatusId}`,
      typeName: "Dinner",
      reference: mine.reference,
      assigneeId: sara,
    });
    expect(byId.has(other.id)).toBe(true);
    const filtered = await board({ context, input: { assigneeId: sara } });
    expect(filtered.cards.map((card) => card.id)).toEqual([mine.id]);
  });

  it("never shows another organization's inquiries or bookings", async () => {
    const { context, type, customer } = await inquirySetup();
    await createTestInquiry({ context, entityTypeId: type.id, customerId: customer.id });
    const foreign = await testOrg();
    expect((await board({ context: foreign })).cards).toEqual([]);
  });
});
