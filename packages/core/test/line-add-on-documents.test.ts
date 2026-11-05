import { describe, expect, it } from "vitest";
import { deriveOrderLines } from "../src/features/quote/derive-lines";
import { itemRows } from "../src/features/run-sheet/item-rows";
import { nestUnderParents, RunSheetRowSchema } from "../src/index";
import { unwrap } from "./helpers";
import { addLine, addOnSetup, START } from "./line-add-on-helpers";

const HOUR = 3_600_000;
const at = ({ hours }: { hours: number }) => new Date(START.getTime() + hours * HOUR);

describe("add-ons on documents (ADR 0088, slice 4)", () => {
  it("nests sub-rows right after their parent and keeps orphans in place", () => {
    const rows = [
      { id: "a", parentId: null },
      { id: "b", parentId: null },
      { id: "a1", parentId: "a" },
      { id: "x1", parentId: "x" },
    ];
    const nested = nestUnderParents({ rows, keys: (row) => row });
    expect(nested.map((row) => row.id)).toEqual(["a", "a1", "b", "x1"]);
  });

  it("puts an add-on right under its parent on the quote's lines", async () => {
    const { context, order, parent, coffee, lineType } = await addOnSetup();
    const base = { context, orderId: order.id };
    const later = { startsAt: at({ hours: 2 }), endsAt: at({ hours: 3 }) };
    const addOn = unwrap({
      result: await addLine({ ...base, parentLineId: parent.id, itemId: coffee.id, ...later }),
    });
    const between = { startsAt: at({ hours: 1 }), endsAt: at({ hours: 2 }) };
    const other = unwrap({
      result: await addLine({ ...base, entityTypeId: lineType.id, itemId: coffee.id, ...between }),
    });
    const derived = (await deriveOrderLines({ context, orderIds: [order.id] })).get(order.id);
    const positions = (derived ?? []).map(({ line }) => [line.lineId, line.role, line.position]);
    expect(positions).toEqual([
      [parent.id, null, 0],
      [addOn.id, "ADD_ON", 1],
      [other.id, null, 2],
    ]);
  });

  it("nests an add-on's run sheet row under its parent's, or names the parent off the run sheet", async () => {
    const { context, order, parent, coffee, lunch } = await addOnSetup();
    const base = { context, orderId: order.id, parentLineId: parent.id, itemId: coffee.id };
    const addOn = unwrap({ result: await addLine({ ...base, name: "Coffee" }) });
    const both = { entityTypeIds: [lunch.entityTypeId, coffee.entityTypeId], fieldIds: [] };
    const rows = await itemRows({ context, orderId: order.id, definition: both });
    const under = rows.find((row) => row.key === addOn.id);
    expect(rows.map((row) => row.key)).toEqual([parent.id, addOn.id]);
    expect(under).toMatchObject({ parentKey: parent.id, addOnTo: "Lunch", label: "Coffee" });
    const parentRow = rows.find((row) => row.key === parent.id);
    expect(parentRow?.addOnTo).toBeUndefined();
    for (const row of rows) expect(RunSheetRowSchema.parse(row)).toEqual(row);
    if (coffee.entityTypeId === lunch.entityTypeId) return;
    const alone = { entityTypeIds: [coffee.entityTypeId], fieldIds: [] };
    const [row] = await itemRows({ context, orderId: order.id, definition: alone });
    expect(row).toMatchObject({ key: addOn.id, parentKey: null, addOnTo: "Lunch" });
  });
});
