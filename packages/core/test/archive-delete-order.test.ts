import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  archiveItem,
  archiveOrderOperation,
  deleteItem,
  deleteOrder,
  getOrder,
  restoreItem,
  restoreOrder,
} from "../src/index";
import { rowOf, runOk, runOn } from "./archive-helpers";
import { errorCode } from "./helpers";
import { addTestLines, createTestQuote, quoteSetup } from "./quote-helpers";

/** A quote setup whose order has a lunch and a coffee line. */
async function orderWithLines() {
  const setup = await quoteSetup();
  const { context, order, lineType } = setup;
  const lines = await addTestLines({
    ...{ context, orderId: order.id, lineTypeId: lineType.id },
    lines: [{ itemId: setup.lunch.id }, { itemId: setup.coffee.id, name: "Coffee" }],
  });
  return { ...setup, lines };
}

describe("archiving, restoring and deleting orders (ADR 0118)", () => {
  it("restores an order with the lines archived with it", async () => {
    const { context, order, lines } = await orderWithLines();
    await runOk({ operation: archiveOrderOperation, id: order.id, context });
    expect((await rowOf({ table: "Order", id: order.id }))?.archivedAt).toBeInstanceOf(Date);
    const lineStatuses = () =>
      getDb().line.findMany({ where: { orderId: order.id }, select: { status: true } });
    expect(await lineStatuses()).toEqual(lines.map(() => ({ status: "ARCHIVED" })));
    const restored = await runOk({ operation: restoreOrder, id: order.id, context });
    expect(restored).toMatchObject({ id: order.id, status: "ACTIVE" });
    expect(await rowOf({ table: "Order", id: order.id })).toEqual({
      status: "ACTIVE",
      archivedAt: null,
    });
    expect(await lineStatuses()).toEqual(lines.map(() => ({ status: "ACTIVE" })));
  });

  it("deletes an archived order with its lines, versions and records", async () => {
    const { context, order, lines } = await orderWithLines();
    const active = await runOn({ operation: deleteOrder, id: order.id, context });
    expect(errorCode({ result: active })).toBe("CONFLICT");
    await runOk({ operation: archiveOrderOperation, id: order.id, context });
    await runOk({ operation: deleteOrder, id: order.id, context });
    expect(await rowOf({ table: "Order", id: order.id })).toBeNull();
    expect(await getDb().line.count({ where: { orderId: order.id } })).toBe(0);
    expect(await getDb().orderVersion.count({ where: { orderId: order.id } })).toBe(0);
    expect(await getDb().orderStatusChange.count({ where: { orderId: order.id } })).toBe(0);
    for (const line of lines) expect(await rowOf({ table: "Record", id: line.id })).toBeNull();
    const gone = await runOn({ operation: getOrder, id: order.id, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("keeps an order whose quote was sent", async () => {
    const { context, order } = await orderWithLines();
    const quote = await createTestQuote({ context, orderId: order.id });
    await getDb().quote.update({ where: { id: quote.id }, data: { quoteStatus: "SENT" } });
    await runOk({ operation: archiveOrderOperation, id: order.id, context });
    const result = await runOn({ operation: deleteOrder, id: order.id, context });
    expect(errorCode({ result })).toBe("CONFLICT");
    expect(result.ok ? null : result.error.issues?.[0]?.path).toBe("quotes");
    expect((await rowOf({ table: "Order", id: order.id }))?.status).toBe("ARCHIVED");
  });

  it("deletes a draft quote with its order", async () => {
    const { context, order } = await orderWithLines();
    const quote = await createTestQuote({ context, orderId: order.id });
    await runOk({ operation: archiveOrderOperation, id: order.id, context });
    await runOk({ operation: deleteOrder, id: order.id, context });
    expect(await getDb().quote.count({ where: { id: quote.id } })).toBe(0);
  });

  it("refuses an item that an archived order's line still uses, until the order is gone", async () => {
    const { context, order, lunch } = await orderWithLines();
    await runOk({ operation: archiveOrderOperation, id: order.id, context });
    await runOk({ operation: archiveItem, id: lunch.id, context });
    const blocked = await runOn({ operation: deleteItem, id: lunch.id, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    const restoreBlocked = await runOn({ operation: restoreOrder, id: order.id, context });
    expect(errorCode({ result: restoreBlocked })).toBe("CONFLICT");
    await runOk({ operation: deleteOrder, id: order.id, context });
    await runOk({ operation: deleteItem, id: lunch.id, context });
    expect(await rowOf({ table: "Item", id: lunch.id })).toBeNull();
    const restoreGone = await runOn({ operation: restoreItem, id: lunch.id, context });
    expect(errorCode({ result: restoreGone })).toBe("NOT_FOUND");
  });
});
