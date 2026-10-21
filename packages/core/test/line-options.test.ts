import { describe, expect, it } from "vitest";
import { execute, listLines } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { choose, optionsSetup } from "./line-options-helpers";
import { createTestQuote } from "./quote-helpers";

describe("line.chooseOptions (ADR 0059)", () => {
  it("adds an option line under the line with the option's price effect", async () => {
    const { context, lineId, technician } = await optionsSetup();
    const { items } = unwrap({
      result: await choose({ context, lineId, optionItemIds: [technician.id] }),
    });
    expect(items.map((line) => [line.itemId, line.parentLineId, line.priceEffect])).toEqual([
      [technician.id, lineId, "EXTRA"],
    ]);
    expect(items[0]).toMatchObject({ name: "Our technician", quantity: 1 });
  });

  it("counts EXTRA on top of the line", async () => {
    const { context, ticket, lineId, technician } = await optionsSetup();
    unwrap({ result: await choose({ context, lineId, optionItemIds: [technician.id] }) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    expect(quote.totalExclVatMinor).toBe(150_000);
  });

  it("leaves an INCLUDED option out of the total", async () => {
    const { context, ticket, lineId, selfInstall } = await optionsSetup();
    unwrap({ result: await choose({ context, lineId, optionItemIds: [selfInstall.id] }) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    expect(quote.totalExclVatMinor).toBe(100_000);
    expect(quote.lines.map((line) => line.inTotal)).toEqual([true, false]);
  });

  it("counts a REPLACES option instead of its line", async () => {
    const { context, ticket, lineId, selfInstall, lounge } = await optionsSetup();
    const optionItemIds = [selfInstall.id, lounge.id];
    unwrap({ result: await choose({ context, lineId, optionItemIds }) });
    const quote = await createTestQuote({ context, ticketId: ticket.id });
    expect(quote.totalExclVatMinor).toBe(150_000);
    const room = quote.lines.find((line) => line.lineId === lineId);
    expect(room?.inTotal).toBe(false);
  });

  it("replaces the choice: a dropped option line is removed, a kept one stays", async () => {
    const { context, lineId, technician, selfInstall, lounge } = await optionsSetup();
    const first = unwrap({
      result: await choose({ context, lineId, optionItemIds: [technician.id, lounge.id] }),
    });
    const second = unwrap({
      result: await choose({ context, lineId, optionItemIds: [selfInstall.id, lounge.id] }),
    });
    expect(second.items.map((line) => line.itemId)).toEqual([selfInstall.id, lounge.id]);
    expect(second.items[1]?.id).toBe(first.items[1]?.id);
    const { ticketId } = first.items[0] ?? { ticketId: "" };
    const listed = unwrap({
      result: await execute({ operation: listLines, input: { ticketId }, context }),
    });
    expect(listed.items.filter((line) => line.parentLineId === lineId)).toHaveLength(2);
  });

  it("skips a group with minimum 0 but not a required one", async () => {
    const { context, lineId, selfInstall, lounge } = await optionsSetup();
    const skipped = await choose({ context, lineId, optionItemIds: [selfInstall.id] });
    expect(errorCode({ result: skipped })).toBeNull();
    const missing = await choose({ context, lineId, optionItemIds: [lounge.id] });
    expect(errorCode({ result: missing })).toBe("VALIDATION");
  });

  it("rejects an item that is not an option and two options of a pick-one group", async () => {
    const { context, lineId, lunch, technician, selfInstall } = await optionsSetup();
    const foreign = await choose({ context, lineId, optionItemIds: [lunch.id] });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
    const both = await choose({ context, lineId, optionItemIds: [technician.id, selfInstall.id] });
    expect(errorCode({ result: both })).toBe("VALIDATION");
  });

  it("does not find another organization's line", async () => {
    const { lineId, selfInstall } = await optionsSetup();
    const other = testContext();
    const result = await choose({ context: other, lineId, optionItemIds: [selfInstall.id] });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});
