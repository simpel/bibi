import { describe, expect, it } from "vitest";
import { execute, getQuote, sendQuote, updateLine } from "../src/index";
import { groupLines } from "./alternative-group-helpers";
import { unwrap } from "./helpers";
import { addLine, addOnSetup } from "./line-add-on-helpers";
import { choose, optionsSetup, picks } from "./line-options-helpers";
import { addTestLines, createTestQuote } from "./quote-helpers";

describe("add-on prices and totals (ADR 0088)", () => {
  it("counts the parent's quantity unless it has its own", async () => {
    const { context, ticket, parent, coffee } = await addOnSetup();
    const base = { context, ticketId: ticket.id, parentLineId: parent.id, itemId: coffee.id };
    const follows = unwrap({ result: await addLine(base) });
    expect(follows).toMatchObject({ effectiveQuantity: 10, quantitySource: "PARENT_LINE" });
    const own = unwrap({ result: await addLine({ ...base, quantity: 3 }) });
    expect(own).toMatchObject({ effectiveQuantity: 3, quantitySource: "LINE" });
    const input = { id: parent.id, quantity: 12 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    const rows = quote.lines.map((line) => [line.lineId, line.quantity]);
    expect(rows).toEqual([
      [parent.id, 12],
      [follows.id, 12],
      [own.id, 3],
    ]);
  });

  it("never takes the parent's discount and always counts", async () => {
    const { context, ticket, parent, coffee } = await addOnSetup();
    const input = { id: parent.id, discountPercent: 50 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    const base = { context, ticketId: ticket.id, parentLineId: parent.id, itemId: coffee.id };
    const addOn = unwrap({ result: await addLine(base) });
    expect(addOn).toMatchObject({ effectiveDiscountPercent: 0, discountSource: null });
    expect(addOn).toMatchObject({ effectiveUnitPriceMinor: 4_000, unitPriceSource: "ITEM" });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    // Lunch 10 × 250 kr − 50 % plus coffee 10 × 40 kr.
    expect(quote.totalExclVatMinor).toBe(125_000 + 40_000);
    expect(quote.lines.map((line) => line.inTotal)).toEqual([true, true]);
  });

  it("is snapshotted with its parent and role when the quote is sent", async () => {
    const { context, ticket, parent, coffee } = await addOnSetup();
    const base = { context, ticketId: ticket.id, parentLineId: parent.id, itemId: coffee.id };
    const addOn = unwrap({ result: await addLine(base) });
    const draft = await createTestQuote({ context, ticketId: ticket.id });
    unwrap({ result: await execute({ operation: sendQuote, input: { id: draft.id }, context }) });
    const sent = unwrap({
      result: await execute({ operation: getQuote, input: { id: draft.id }, context }),
    });
    const rows = sent.lines.map((line) => [line.lineId, line.parentLineId, line.role]);
    expect(rows).toEqual([
      [parent.id, null, null],
      [addOn.id, parent.id, "ADD_ON"],
    ]);
    const stored = await context.db.orderLine.findMany({ where: { lineId: addOn.id } });
    expect(stored.map((row) => row.role)).toEqual(["ADD_ON"]);
  });

  it("is left out with a parent that is an unchosen alternative", async () => {
    const { context, ticket, parent, coffee, lineType } = await addOnSetup();
    const base = { context, ticketId: ticket.id, parentLineId: parent.id, itemId: coffee.id };
    const addOn = unwrap({ result: await addLine(base) });
    const [cheaper] = await addTestLines({
      ...{ context, ticketId: ticket.id, lineTypeId: lineType.id },
      lines: [{ itemId: coffee.id, name: "Coffee only", quantity: 10 }],
    });
    const lineIds = [parent.id, cheaper?.id ?? ""];
    unwrap({ result: await groupLines({ context, ticketId: ticket.id, lineIds }) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    const counted = quote.lines.find((line) => line.lineId === addOn.id);
    expect(counted?.inTotal).toBe(false);
    expect(quote.totalExclVatMinor).toBe(40_000);
  });

  it("is not covered by a REPLACES option of its parent", async () => {
    const { context, ticket, lineId, selfInstall, lounge, technician } = await optionsSetup();
    const options = picks({ ids: [selfInstall.id, lounge.id] });
    unwrap({ result: await choose({ context, lineId, options }) });
    const base = { context, ticketId: ticket.id, parentLineId: lineId, itemId: technician.id };
    unwrap({ result: await addLine(base) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    // The lounge (1 500 kr) replaces the room; the technician add-on (500 kr) counts on top.
    expect(quote.totalExclVatMinor).toBe(150_000 + 50_000);
  });
});
