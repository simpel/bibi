import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  type ExecuteContext,
  execute,
  getAlternativeGroup,
  getQuote,
  sendQuote,
} from "../src/index";
import { groupLines } from "./alternative-group-helpers";
import { errorCode, unwrap } from "./helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

/** Lunch (5 000 kr) or coffee (800 kr) as alternatives, plus a 300 kr room fee, on a DRAFT. */
async function draftWithMeal() {
  const setup = await quoteSetup();
  const { context, ticket, lineType, lunch, coffee } = setup;
  const lines = [
    { itemId: lunch.id },
    { itemId: coffee.id, name: "Coffee", quantity: 20 },
    { itemId: coffee.id, name: "Room fee", quantity: 1, unitPriceMinor: 30_000 },
  ];
  const [lunchLine, coffeeLine, feeLine] = await addTestLines({
    ...{ context, ticketId: ticket.id, lineTypeId: lineType.id, lines },
  });
  const lineIds = [lunchLine?.id ?? "", coffeeLine?.id ?? ""];
  const group = unwrap({
    result: await groupLines({ context, ticketId: ticket.id, lineIds, name: "Meal" }),
  });
  const draft = await createTestQuote({ context, ticketId: ticket.id });
  return { ...setup, draft, group, lunchLine, coffeeLine, feeLine };
}

const read = async ({ context, id }: { context: ExecuteContext; id: string }) =>
  unwrap({ result: await execute({ operation: getQuote, input: { id }, context }) });

describe("alternatives on the quote (ADR 0052)", () => {
  it("shows each option's price and counts the cheapest as a from price", async () => {
    const { context, draft, coffeeLine, lunchLine } = await draftWithMeal();
    const quote = await read({ context, id: draft.id });
    const byLine = new Map(quote.lines.map((line) => [line.lineId, line]));
    expect(byLine.get(lunchLine?.id ?? "")).toMatchObject({
      alternativeGroupName: "Meal",
      alternativeGroupChosen: false,
      inTotal: false,
      totalExclVatMinor: 500_000,
    });
    expect(byLine.get(coffeeLine?.id ?? "")).toMatchObject({ inTotal: true });
    expect(quote).toMatchObject({ totalIsFrom: true, totalExclVatMinor: 80_000 + 30_000 });
  });

  it("freezes the groups in the snapshot, and accept records the customer's pick", async () => {
    const { context, draft, group, lunchLine, coffeeLine, feeLine } = await draftWithMeal();
    const input = { id: draft.id };
    const sent = unwrap({ result: await execute({ operation: sendQuote, input, context }) });
    expect(sent).toMatchObject({ totalIsFrom: true, totalExclVatMinor: 110_000 });
    const rows = await context.db.orderLine.findMany({ where: { quoteId: draft.id } });
    expect(rows.filter((row) => row.alternativeGroupId === group.id)).toHaveLength(2);

    const wrong = { id: draft.id, chosenLineIds: [feeLine?.id ?? ""] };
    const refused = await execute({ operation: acceptQuote, input: wrong, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const twice = { id: draft.id, chosenLineIds: [lunchLine?.id ?? "", coffeeLine?.id ?? ""] };
    const double = await execute({ operation: acceptQuote, input: twice, context });
    expect(errorCode({ result: double })).toBe("VALIDATION");

    const picked = { id: draft.id, chosenLineIds: [lunchLine?.id ?? ""] };
    const accepted = unwrap({
      result: await execute({ operation: acceptQuote, input: picked, context }),
    });
    expect(accepted).toMatchObject({ quoteStatus: "ACCEPTED", totalExclVatMinor: 110_000 });
    const chosen = await execute({ operation: getAlternativeGroup, input: group, context });
    expect(unwrap({ result: chosen }).chosenLineId).toBe(lunchLine?.id);
  });
});
