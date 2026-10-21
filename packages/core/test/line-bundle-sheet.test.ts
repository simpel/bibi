import { describe, expect, it } from "vitest";
import { itemRows } from "../src/features/sheet/item-rows";
import { SheetRowSchema } from "../src/index";
import { unwrap } from "./helpers";
import { bundleSetup, expand } from "./line-bundle-helpers";

describe("sheets and bundles (ADR 0059)", () => {
  it("lists the part lines in sheet states and not their bundle line", async () => {
    const { context, ticket, lineType, bundle, bundleType, lunch } = await bundleSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: lineType.id, itemId: bundle.id };
    const { items } = unwrap({ result: await expand(base) });
    const definition = { entityTypeIds: [lunch.entityTypeId, bundleType.id], fieldIds: [] };
    const rows = await itemRows({ context, ticketId: ticket.id, definition });
    expect(rows.map((row) => [row.key, row.label, row.quantity])).toEqual([
      [items[2]?.id, "Coffee", 20],
      [items[3]?.id, "Lunch", 20],
    ]);
    for (const row of rows) expect(SheetRowSchema.parse(row)).toEqual(row);
  });
});
