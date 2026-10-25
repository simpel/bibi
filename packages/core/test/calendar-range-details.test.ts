import { describe, expect, it } from "vitest";
import { calendarSetup, range } from "./calendar-range-helpers";
import { testContext } from "./helpers";

const DAY = { from: "2026-11-01", to: "2026-11-01" };

/** The setup's line with a note, a price, a quantity and a headcount on its ticket. */
async function pricedSetup() {
  const setup = await calendarSetup();
  const { context, line } = setup;
  await context.db.line.update({
    where: { id: line.id },
    data: { note: "Vegan lunch", unitPriceMinor: 27_000, quantity: 40 },
  });
  await context.db.ticket.update({
    where: { id: line.ticketId },
    data: { estimatedHeadcount: 42 },
  });
  return setup;
}

describe("calendar.range details (ADR 0071 view read model)", () => {
  it("joins the customer, headcount, value and note onto a line's block", async () => {
    const { context, line } = await pricedSetup();
    const ticket = await context.db.ticket.findFirstOrThrow({
      where: { id: line.ticketId },
      include: { customer: true },
    });
    const { blocks } = await range({ context, input: DAY });
    const hold = blocks.find((block) => block.lineId === line.id);
    expect(hold?.details).toMatchObject({
      customer: ticket.customer.name,
      headcount: 42,
      quantity: 40,
      valueMinor: 40 * 27_000,
      note: "Vegan lunch",
      staff: [],
    });
    expect(blocks.find((block) => block.type === "MAINTENANCE")?.details).toBeNull();
  });

  it("hides each joined field without its feature's read", async () => {
    const { context, line } = await pricedSetup();
    const reader = testContext({
      organizationId: context.organizationId,
      permissions: { ticket: ["read"] },
    });
    const { blocks } = await range({ context: reader, input: DAY });
    const hold = blocks.find((block) => block.lineId === line.id);
    expect(hold?.details).toMatchObject({
      customer: null,
      client: null,
      headcount: 42,
      quantity: null,
      valueMinor: null,
      note: null,
      staff: [],
    });
  });
});
