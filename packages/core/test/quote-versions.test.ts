import { describe, expect, it } from "vitest";
import {
  archiveLine,
  declineQuote,
  execute,
  getQuote,
  listOrderVersions,
  reopenQuote,
  reviseQuote,
  sendQuote,
  updateLine,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestLines, draftQuote as draft } from "./quote-helpers";

describe("quote.revise (ADR 0022)", () => {
  it("copies the latest version into a marked DRAFT and supersedes it on send", async () => {
    const { context, order, lineType, quote, coffee, lineId } = await draft();
    const draftRevise = await execute({ operation: reviseQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: draftRevise })).toBe("CONFLICT");
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    const v2 = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: quote.id }, context }),
    });
    expect(v2).toMatchObject({ version: 2, previousId: quote.id, quoteStatus: "DRAFT" });
    expect(v2.lines.map((line) => line.change)).toEqual(["UNCHANGED"]);
    const older = await execute({ operation: reviseQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: older })).toBe("CONFLICT");
    const lines = [{ itemId: coffee.id, name: "Coffee" }];
    await addTestLines({ context, orderId: order.id, lineTypeId: lineType.id, lines });
    const input = { id: lineId, quantity: 25 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    const edited = unwrap({
      result: await execute({ operation: getQuote, input: { id: v2.id }, context }),
    });
    expect(edited.lines.map((line) => [line.change, line.changedFields])).toEqual([
      ["CHANGED", ["quantity"]],
      ["ADDED", []],
    ]);
    unwrap({ result: await execute({ operation: sendQuote, input: { id: v2.id }, context }) });
    const v1 = unwrap({
      result: await execute({ operation: getQuote, input: { id: quote.id }, context }),
    });
    expect(v1.quoteStatus).toBe("SUPERSEDED");
  });

  it("lists the lines a version removed", async () => {
    const { context, quote, lineId } = await draft();
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    unwrap({
      result: await execute({ operation: declineQuote, input: { id: quote.id }, context }),
    });
    const v2 = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: quote.id }, context }),
    });
    unwrap({ result: await execute({ operation: archiveLine, input: { id: lineId }, context }) });
    const emptied = unwrap({
      result: await execute({ operation: getQuote, input: { id: v2.id }, context }),
    });
    expect(emptied.removedLines.map((line) => line.name)).toEqual(["Lunch"]);
  });
});

describe("quote.reopen (ADR 0116)", () => {
  it("sets a superseded quote as current again, restoring the order without accepting", async () => {
    const { context, order, quote, lineId } = await draft();
    const get = async ({ id }: { id: string }) =>
      unwrap({ result: await execute({ operation: getQuote, input: { id }, context }) });
    unwrap({ result: await execute({ operation: sendQuote, input: { id: quote.id }, context }) });
    const sentAgain = await execute({ operation: reopenQuote, input: { id: quote.id }, context });
    expect(errorCode({ result: sentAgain })).toBe("CONFLICT");
    const v2 = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: quote.id }, context }),
    });
    const input = { id: lineId, quantity: 25 };
    unwrap({ result: await execute({ operation: updateLine, input, context }) });
    unwrap({ result: await execute({ operation: sendQuote, input: { id: v2.id }, context }) });
    const reopened = unwrap({
      result: await execute({ operation: reopenQuote, input: { id: quote.id }, context }),
    });
    expect(reopened.quoteStatus).toBe("SENT");
    expect((await get({ id: v2.id })).quoteStatus).toBe("SUPERSEDED");
    const versions = unwrap({
      result: await execute({
        operation: listOrderVersions,
        input: { orderId: order.id },
        context,
      }),
    }).items;
    const v1Version = versions.find(({ id }) => id === reopened.versionId);
    expect(v1Version?.isCurrent).toBe(true);
  });
});
