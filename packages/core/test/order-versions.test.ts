import { describe, expect, it } from "vitest";
import {
  acceptQuote,
  archiveLine,
  type ExecuteContext,
  execute,
  getLine,
  getQuote,
  listOrderVersions,
  nameOrderVersion,
  restoreOrderVersion,
  reviseQuote,
  sendQuote,
  updateLine,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestLines, draftQuote } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

const versionsOf = async ({ context, orderId }: Ctx & { orderId: string }) =>
  unwrap({ result: await execute({ operation: listOrderVersions, input: { orderId }, context }) })
    .items;

const send = async ({ context, id }: Ctx & { id: string }) =>
  unwrap({ result: await execute({ operation: sendQuote, input: { id }, context }) });

/** A sent quote v1 for one lunch, then quantity 25 and an added coffee on the order. */
async function sentThenEdited() {
  const setup = await draftQuote();
  const { context, order, lineType, coffee, quote, lineId } = setup;
  const v1 = await send({ context, id: quote.id });
  const input = { id: lineId, quantity: 25 };
  unwrap({ result: await execute({ operation: updateLine, input, context }) });
  const lines = [{ itemId: coffee.id, name: "Coffee" }];
  const [added] = await addTestLines({
    context,
    orderId: order.id,
    lineTypeId: lineType.id,
    lines,
  });
  return { ...setup, v1, coffeeLineId: added?.id ?? "" };
}

describe("order versions (ADR 0116)", () => {
  it("captures versions, seals the one a quote was sent as and collapses later edits", async () => {
    const { context, order, v1 } = await sentThenEdited();
    const [now, sent] = await versionsOf({ context, orderId: order.id });
    expect(v1.versionId).toBe(sent?.id);
    expect(sent).toMatchObject({ isCurrent: false, changeCount: 2, lineCount: 1 });
    expect(sent?.quotes).toEqual([{ id: v1.id, version: 1, quoteStatus: "SENT" }]);
    expect(now).toMatchObject({ isCurrent: true, changeCount: 0, lineCount: 2 });
    expect(now?.number).toBe((sent?.number ?? 0) + 1);
  });

  it("keeps a named version apart from later edits", async () => {
    const { context, order, lineId } = await draftQuote();
    const [latest] = await versionsOf({ context, orderId: order.id });
    const input = { id: latest?.id ?? "", name: "First idea" };
    unwrap({ result: await execute({ operation: nameOrderVersion, input, context }) });
    const edit = { id: lineId, quantity: 12 };
    unwrap({ result: await execute({ operation: updateLine, input: edit, context }) });
    const [now, named] = await versionsOf({ context, orderId: order.id });
    expect(named).toMatchObject({ name: "First idea", isCurrent: false, changeCount: 1 });
    expect(now).toMatchObject({ name: null, isCurrent: true });
  });

  it("restores a sent version: removes added lines, sets content back, keeps history", async () => {
    const { context, order, lineId, coffeeLineId, v1 } = await sentThenEdited();
    const input = { id: v1.versionId ?? "" };
    const restored = unwrap({
      result: await execute({ operation: restoreOrderVersion, input, context }),
    });
    expect(restored).toMatchObject({ restoredFromId: v1.versionId, isCurrent: true });
    const lunch = unwrap({
      result: await execute({ operation: getLine, input: { id: lineId }, context }),
    });
    expect(lunch.quantity).toBeNull();
    const coffee = await execute({ operation: getLine, input: { id: coffeeLineId }, context });
    expect(errorCode({ result: coffee })).toBe("NOT_FOUND");
    const versions = await versionsOf({ context, orderId: order.id });
    expect(versions.find((version) => version.id === v1.versionId)?.isCurrent).toBe(true);
    expect(versions).toHaveLength(3);
  });

  it("brings a removed line back with its id", async () => {
    const { context, quote, lineId } = await draftQuote();
    const v1 = await send({ context, id: quote.id });
    unwrap({ result: await execute({ operation: archiveLine, input: { id: lineId }, context }) });
    const input = { id: v1.versionId ?? "" };
    unwrap({ result: await execute({ operation: restoreOrderVersion, input, context }) });
    const lunch = unwrap({
      result: await execute({ operation: getLine, input: { id: lineId }, context }),
    });
    expect(lunch.status).toBe("ACTIVE");
  });

  it("accepts a superseded quote: restores its version and declines the newer one", async () => {
    const { context, lineId, v1 } = await sentThenEdited();
    const draft = unwrap({
      result: await execute({ operation: reviseQuote, input: { id: v1.id }, context }),
    });
    const v2 = await send({ context, id: draft.id });
    const superseded = unwrap({
      result: await execute({ operation: getQuote, input: { id: v1.id }, context }),
    });
    expect(superseded.quoteStatus).toBe("SUPERSEDED");
    const accepted = unwrap({
      result: await execute({ operation: acceptQuote, input: { id: v1.id }, context }),
    });
    expect(accepted.quoteStatus).toBe("ACCEPTED");
    const newer = unwrap({
      result: await execute({ operation: getQuote, input: { id: v2.id }, context }),
    });
    expect(newer.quoteStatus).toBe("DECLINED");
    const lunch = unwrap({
      result: await execute({ operation: getLine, input: { id: lineId }, context }),
    });
    expect(lunch.quantity).toBeNull();
  });
});
