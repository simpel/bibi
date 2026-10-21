import { describe, expect, it } from "vitest";
import {
  archiveLine,
  execute,
  getQuote,
  grantAll,
  listLines,
  sendQuote,
  updateItem,
  updateLine,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { bundleSetup, expand } from "./line-bundle-helpers";
import { hours } from "./occupancy-helpers";
import { createTestQuote } from "./quote-helpers";

async function expanded() {
  const setup = await bundleSetup();
  const { context, ticket, lineType, bundle } = setup;
  const base = { context, ticketId: ticket.id, entityTypeId: lineType.id, itemId: bundle.id };
  const { items } = unwrap({ result: await expand(base) });
  return { ...setup, base, items };
}

const at = ({ hour, minute = 0 }: { hour: number; minute?: number }) =>
  new Date(Date.UTC(2026, 10, 1, hour, minute));

describe("line.expandBundle (ADR 0059)", () => {
  it("adds a bundle line and part lines with times from the parts' offsets", async () => {
    const { items, bundle, room, lunch, coffee } = await expanded();
    const [head, ...parts] = items;
    expect(head).toMatchObject({ itemId: bundle.id, name: "Conference day", parentLineId: null });
    expect(head?.effectiveUnitPriceMinor).toBe(60_000);
    expect(
      parts.map((line) => [line.itemId, line.parentLineId, line.startsAt, line.endsAt]),
    ).toEqual([
      [room.id, head?.id, at({ hour: 9 }), at({ hour: 17 })],
      [coffee.id, head?.id, at({ hour: 10, minute: 30 }), at({ hour: 11 })],
      [lunch.id, head?.id, at({ hour: 12 }), at({ hour: 13 })],
    ]);
    expect(parts.map((line) => line.quantity)).toEqual([null, null, null]);
  });

  it("prices the bundle line with VAT per rate; the parts sum exactly and do not count", async () => {
    const { context, ticket, items } = await expanded();
    const draft = await createTestQuote({ context, ticketId: ticket.id });
    const [bundleLine, ...parts] = draft.lines;
    expect(bundleLine).toMatchObject({ lineId: items[0]?.id, inTotal: true, vatMinor: 264_930 });
    expect(bundleLine?.vatRows).toEqual([
      { vatRatePercent: 12, totalExclVatMinor: 269_767, vatMinor: 32_372 },
      { vatRatePercent: 25, totalExclVatMinor: 930_233, vatMinor: 232_558 },
    ]);
    const rowsExcl = bundleLine?.vatRows.reduce((sum, row) => sum + row.totalExclVatMinor, 0);
    expect(rowsExcl).toBe(bundleLine?.totalExclVatMinor);
    expect(parts.map((line) => [line.inTotal, line.parentLineId])).toEqual(
      parts.map(() => [false, items[0]?.id]),
    );
    expect(draft).toMatchObject({ totalExclVatMinor: 1_200_000, totalInclVatMinor: 1_464_930 });
    const sent = unwrap({
      result: await execute({ operation: sendQuote, input: { id: draft.id }, context }),
    });
    expect(sent.totalInclVatMinor).toBe(1_464_930);
    const frozen = await context.db.orderLine.findFirst({ where: { lineId: items[0]?.id } });
    expect(frozen?.vatRows).toEqual(bundleLine?.vatRows);
    const read = unwrap({
      result: await execute({ operation: getQuote, input: { id: sent.id }, context }),
    });
    expect(read.lines.map((line) => line.parentLineId)).toEqual(
      draft.lines.map((l) => l.parentLineId),
    );
  });

  it("moves the part lines with the bundle line and removes them with it", async () => {
    const { context, items } = await expanded();
    const id = items[0]?.id ?? "";
    const later = { id, ...hours({ from: 10, to: 18 }) };
    unwrap({ result: await execute({ operation: updateLine, input: later, context }) });
    const list = { parentLineId: id };
    const moved = unwrap({ result: await execute({ operation: listLines, input: list, context }) });
    expect(moved.items.map((line) => line.startsAt)).toEqual([
      at({ hour: 10 }),
      at({ hour: 11, minute: 30 }),
      at({ hour: 13 }),
    ]);
    unwrap({ result: await execute({ operation: archiveLine, input: { id }, context }) });
    const left = unwrap({ result: await execute({ operation: listLines, input: list, context }) });
    expect(left.items).toEqual([]);
  });

  it("keeps the bundle item on a bundle line with parts", async () => {
    const { context, items, lunch } = await expanded();
    const input = { id: items[0]?.id ?? "", itemId: lunch.id };
    expect(errorCode({ result: await execute({ operation: updateLine, input, context }) })).toBe(
      "VALIDATION",
    );
  });

  it("refuses an item that is not a bundle and a caller who may not read items", async () => {
    const { context, base, lunch } = await bundleSetup().then((setup) => ({
      ...setup,
      base: { ticketId: setup.ticket.id, entityTypeId: setup.lineType.id, itemId: setup.bundle.id },
    }));
    expect(errorCode({ result: await expand({ context, ...base, itemId: lunch.id }) })).toBe(
      "VALIDATION",
    );
    const permissions = { ...grantAll({}), item: [] };
    const blind = testContext({ organizationId: context.organizationId, permissions });
    const refused = await expand({ context: blind, ...base });
    expect(refused.ok ? null : [refused.error.code, refused.error.issues]).toEqual([
      "VALIDATION",
      [{ path: "itemId", message: "Missing permission item:read" }],
    ]);
  });

  it("refuses a part without a duration that would start after the bundle ends", async () => {
    const { context, ticket, lineType, bundle, room } = await bundleSetup();
    const parts = [{ itemId: room.id, offsetMinutes: 120 }];
    unwrap({
      result: await execute({ operation: updateItem, input: { id: bundle.id, parts }, context }),
    });
    const base = { context, ticketId: ticket.id, entityTypeId: lineType.id, itemId: bundle.id };
    const short = await expand({ ...base, ...hours({ from: 9, to: 10 }) });
    expect(errorCode({ result: short })).toBe("VALIDATION");
  });
});
