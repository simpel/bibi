import { describe, expect, it } from "vitest";
import { execute, getLine, listLines } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { choose, optionsSetup, picks } from "./line-options-helpers";
import { createTestQuote } from "./quote-helpers";

describe("line.chooseOptions (ADR 0059)", () => {
  it("adds an option line under the line with the option's price effect", async () => {
    const { context, lineId, technician } = await optionsSetup();
    const { items } = unwrap({
      result: await choose({ context, lineId, options: picks({ ids: [technician.id] }) }),
    });
    expect(items.map((line) => [line.itemId, line.parentLineId, line.priceEffect])).toEqual([
      [technician.id, lineId, "EXTRA"],
    ]);
    // A normal group's option has no quantity of its own: its parent's (ADR 0082).
    expect(items[0]).toMatchObject({ name: "Our technician", quantity: null });
    expect(items[0]).toMatchObject({ effectiveQuantity: 1, quantitySource: "PARENT_LINE" });
  });

  it("counts EXTRA on top of the line", async () => {
    const { context, order, lineId, technician } = await optionsSetup();
    unwrap({ result: await choose({ context, lineId, options: picks({ ids: [technician.id] }) }) });
    const quote = await createTestQuote({ context, orderId: order.id });
    expect(quote.totalExclVatMinor).toBe(150_000);
  });

  it("leaves an INCLUDED option out of the total", async () => {
    const { context, order, lineId, selfInstall } = await optionsSetup();
    unwrap({
      result: await choose({ context, lineId, options: picks({ ids: [selfInstall.id] }) }),
    });
    const quote = await createTestQuote({ context, orderId: order.id });
    expect(quote.totalExclVatMinor).toBe(100_000);
    expect(quote.lines.map((line) => line.inTotal)).toEqual([true, false]);
  });

  it("counts a REPLACES option instead of its line", async () => {
    const { context, order, lineId, selfInstall, lounge } = await optionsSetup();
    const options = picks({ ids: [selfInstall.id, lounge.id] });
    unwrap({ result: await choose({ context, lineId, options }) });
    const quote = await createTestQuote({ context, orderId: order.id });
    expect(quote.totalExclVatMinor).toBe(150_000);
    const room = quote.lines.find((line) => line.lineId === lineId);
    expect(room?.inTotal).toBe(false);
  });

  it("replaces the choice: a dropped option line is removed, a kept one stays", async () => {
    const { context, lineId, technician, selfInstall, lounge } = await optionsSetup();
    const first = unwrap({
      result: await choose({
        context,
        lineId,
        options: picks({ ids: [technician.id, lounge.id] }),
      }),
    });
    const second = unwrap({
      result: await choose({
        context,
        lineId,
        options: picks({ ids: [selfInstall.id, lounge.id] }),
      }),
    });
    expect(second.items.map((line) => line.itemId)).toEqual([selfInstall.id, lounge.id]);
    expect(second.items[1]?.id).toBe(first.items[1]?.id);
    const { orderId } = first.items[0] ?? { orderId: "" };
    const listed = unwrap({
      result: await execute({ operation: listLines, input: { orderId }, context }),
    });
    expect(listed.items.filter((line) => line.parentLineId === lineId)).toHaveLength(2);
  });

  it("leaves a required group open with a warning until it is chosen (ADR 0089)", async () => {
    const { context, lineId, selfInstall, lounge } = await optionsSetup();
    const read = async () =>
      unwrap({ result: await execute({ operation: getLine, input: { id: lineId }, context }) });
    const kinds = async () => (await read()).warnings.map((warning) => warning.kind);
    expect(await kinds()).toEqual(["UNCHOSEN_REQUIRED_GROUP"]);
    const open = await choose({ context, lineId, options: picks({ ids: [lounge.id] }) });
    expect(errorCode({ result: open })).toBeNull();
    expect(await kinds()).toEqual(["UNCHOSEN_REQUIRED_GROUP"]);
    unwrap({
      result: await choose({ context, lineId, options: picks({ ids: [selfInstall.id] }) }),
    });
    expect(await kinds()).toEqual([]);
  });

  it("rejects an item that is not an option and two options of a pick-one group", async () => {
    const { context, lineId, lunch, technician, selfInstall } = await optionsSetup();
    const foreign = await choose({ context, lineId, options: picks({ ids: [lunch.id] }) });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
    const both = await choose({
      context,
      lineId,
      options: picks({ ids: [technician.id, selfInstall.id] }),
    });
    expect(errorCode({ result: both })).toBe("VALIDATION");
  });

  it("does not find another organization's line", async () => {
    const { lineId, selfInstall } = await optionsSetup();
    const other = testContext();
    const result = await choose({
      context: other,
      lineId,
      options: picks({ ids: [selfInstall.id] }),
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});
