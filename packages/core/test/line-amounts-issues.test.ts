import { describe, expect, it } from "vitest";
import { execute, lineAmounts, lineIssues, PRESET_PERMISSIONS } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { bookRoom, previewSetup } from "./preview-helpers";
import { addTestLines, quoteSetup } from "./quote-helpers";
import { addLine } from "./status-grid-helpers";

type Setup = Awaited<ReturnType<typeof previewSetup>>;

const issuesOf = async ({ setup, ticketId }: { setup: Setup; ticketId: string }) =>
  unwrap({
    result: await execute({ operation: lineIssues, input: { ticketId }, context: setup.context }),
  });

describe("line.amounts (ADR 0052)", () => {
  it("prices the ticket's lines as a draft quote does and leaves unpriced lines out", async () => {
    const { context, ticket, lineType, lunch, coffee, unpriced } = await quoteSetup();
    const lines = [
      { itemId: lunch.id },
      { itemId: coffee.id, name: "Coffee", unitPriceMinor: 3_500, discountPercent: 10 },
      { itemId: unpriced.id, name: "Surprise" },
    ];
    const [lunchLine, coffeeLine] = await addTestLines({
      ...{ context, ticketId: ticket.id, lineTypeId: lineType.id, lines },
    });
    const input = { ticketId: ticket.id };
    const amounts = unwrap({ result: await execute({ operation: lineAmounts, input, context }) });
    expect(amounts).toMatchObject({
      totalExclVatMinor: 563_000,
      totalInclVatMinor: 630_560,
      totalIsFrom: false,
    });
    expect(amounts.lines.map(({ lineId, inTotal }) => [lineId, inTotal])).toEqual([
      [lunchLine?.id, true],
      [coffeeLine?.id, true],
    ]);
  });

  it("answers NOT_FOUND for another organization's ticket", async () => {
    const { ticket } = await quoteSetup();
    const result = await execute({
      operation: lineAmounts,
      input: { ticketId: ticket.id },
      context: testContext(),
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});

describe("line.issues (ADR 0081)", () => {
  it("never counts the ticket's own holds against it", async () => {
    const setup = await previewSetup();
    const ticket = await setup.newTicket();
    await addLine({ setup, ticketId: ticket.id, itemId: setup.room.id, from: 9 });
    expect(await issuesOf({ setup, ticketId: ticket.id })).toEqual({
      availabilityHidden: false,
      lines: [],
    });
  });

  it("reports another ticket's hard hold as HARD_CLASH with its reference", async () => {
    const setup = await previewSetup();
    const ticket = await setup.newTicket();
    const line = await addLine({ setup, ticketId: ticket.id, itemId: setup.room.id, from: 9 });
    const other = await bookRoom({ setup, from: 10, hard: true });
    const result = await issuesOf({ setup, ticketId: ticket.id });
    expect(result.lines).toEqual([
      {
        lineId: line.id,
        name: line.name,
        issues: [
          expect.objectContaining({
            kind: "HARD_CLASH",
            ticketReference: other.ticket.reference,
            otherLineId: null,
          }),
        ],
      },
    ]);
  });

  it("reports two of the ticket's lines on one item at once as SELF_OVERLAP", async () => {
    const setup = await previewSetup();
    const ticket = await setup.newTicket();
    const first = await addLine({ setup, ticketId: ticket.id, itemId: setup.room.id, from: 9 });
    const second = await addLine({ setup, ticketId: ticket.id, itemId: setup.room.id, from: 10 });
    const result = await issuesOf({ setup, ticketId: ticket.id });
    const kinds = result.lines.map(({ lineId, issues }) => [
      lineId,
      issues.map(({ kind, otherLineId }) => [kind, otherLineId]),
    ]);
    expect(kinds).toEqual([
      [first.id, [["SELF_OVERLAP", second.id]]],
      [second.id, [["SELF_OVERLAP", first.id]]],
    ]);
  });

  it("hides availability without item:read and answers NOT_FOUND across organizations", async () => {
    const setup = await previewSetup();
    const ticket = await setup.newTicket();
    await addLine({ setup, ticketId: ticket.id, itemId: setup.room.id, from: 9 });
    await bookRoom({ setup, from: 10, hard: true });
    const { item: _item, ...rest } = PRESET_PERMISSIONS.admin;
    const hidden = testContext({ organizationId: setup.context.organizationId, permissions: rest });
    const input = { ticketId: ticket.id };
    const result = unwrap({
      result: await execute({ operation: lineIssues, input, context: hidden }),
    });
    expect(result).toEqual({ availabilityHidden: true, lines: [] });
    const elsewhere = await execute({ operation: lineIssues, input, context: testContext() });
    expect(errorCode({ result: elsewhere })).toBe("NOT_FOUND");
  });
});
