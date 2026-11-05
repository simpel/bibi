import { describe, expect, it } from "vitest";
import { execute, getItem, getLine, sendQuote, updateLine } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { splitSetup } from "./line-option-quantities-helpers";
import { choose } from "./line-options-helpers";
import { createTestQuote } from "./quote-helpers";

type Setup = Awaited<ReturnType<typeof splitSetup>>;

const readLine = async ({ context, lineId }: Pick<Setup, "context" | "lineId">) =>
  unwrap({ result: await execute({ operation: getLine, input: { id: lineId }, context }) });

describe("option quantities in split groups (ADR 0082)", () => {
  it("gives each option of a split group its own quantity", async () => {
    const { context, lineId, fish, veg } = await splitSetup();
    const options = [
      { itemId: fish.id, quantity: 10 },
      { itemId: veg.id, quantity: 4 },
    ];
    const { items } = unwrap({ result: await choose({ context, lineId, options }) });
    expect(items.map((line) => [line.itemId, line.quantity, line.quantitySource])).toEqual([
      [fish.id, 10, "LINE"],
      [veg.id, 4, "LINE"],
    ]);
    expect((await readLine({ context, lineId })).warnings).toEqual([]);
  });

  it("requires a quantity in a split group and refuses one in a normal group", async () => {
    const { context, lineId, fish, espresso } = await splitSetup();
    const missing = await choose({ context, lineId, options: [{ itemId: fish.id }] });
    expect(errorCode({ result: missing })).toBe("VALIDATION");
    const options = [
      { itemId: fish.id, quantity: 14 },
      { itemId: espresso.id, quantity: 3 },
    ];
    expect(errorCode({ result: await choose({ context, lineId, options }) })).toBe("VALIDATION");
  });

  it("warns, never refuses, when the quantities do not add up to the line's", async () => {
    const { context, lineId, dinner, fish, veg } = await splitSetup();
    const options = [
      { itemId: fish.id, quantity: 10 },
      { itemId: veg.id, quantity: 3 },
    ];
    unwrap({ result: await choose({ context, lineId, options }) });
    const item = unwrap({
      result: await execute({ operation: getItem, input: { id: dinner.id }, context }),
    });
    const group = item.customisationGroups.find((each) => each.name === "Main course");
    expect((await readLine({ context, lineId })).warnings).toEqual([
      { id: group?.id, kind: "OPTION_SPLIT_MISMATCH", sum: 13, expected: 14 },
    ]);
  });

  it("counts EXTRA options at their own quantities", async () => {
    const { context, order, lineId, fish, veg } = await splitSetup();
    const options = [
      { itemId: fish.id, quantity: 10 },
      { itemId: veg.id, quantity: 4 },
    ];
    unwrap({ result: await choose({ context, lineId, options }) });
    const quote = await createTestQuote({ context, orderId: order.id });
    expect(quote.totalExclVatMinor).toBe(14 * 50_000 + 10 * 10_000 + 4 * 5_000);
  });

  it("counts a split REPLACES option and the rest of its parent, and freezes both", async () => {
    const { context, order, lineId, fish, vegan } = await splitSetup();
    const options = [
      { itemId: fish.id, quantity: 10 },
      { itemId: vegan.id, quantity: 4 },
    ];
    unwrap({ result: await choose({ context, lineId, options }) });
    const draft = await createTestQuote({ context, orderId: order.id });
    expect(draft.totalExclVatMinor).toBe(10 * 50_000 + 10 * 10_000 + 4 * 60_000);
    const sent = unwrap({
      result: await execute({ operation: sendQuote, input: { id: draft.id }, context }),
    });
    const rows = await context.db.orderLine.findMany({
      where: { quoteId: sent.id },
      orderBy: { position: "asc" },
    });
    expect(rows.map((row) => [row.name, row.quantity, row.inTotal])).toEqual([
      ["Dinner", 10, true],
      ["Fish", 10, true],
      ["Vegan menu", 4, true],
    ]);
  });

  it("leaves a normal option without a quantity of its own on line.update", async () => {
    const { context, lineId, fish, espresso } = await splitSetup();
    const options = [{ itemId: fish.id, quantity: 14 }, { itemId: espresso.id }];
    const { items } = unwrap({ result: await choose({ context, lineId, options }) });
    const [main, coffee] = items.map((line) => line.id);
    const split = { id: main ?? "", quantity: 12 };
    const changed = await execute({ operation: updateLine, input: split, context });
    expect(errorCode({ result: changed })).toBeNull();
    const normal = { id: coffee ?? "", quantity: 3 };
    const refused = await execute({ operation: updateLine, input: normal, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });
});
