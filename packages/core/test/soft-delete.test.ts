import { describe, expect, it } from "vitest";
import {
  archiveItem,
  archiveVenue,
  createVenue,
  execute,
  getItem,
  listItems,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

describe("soft delete", () => {
  it("hides archived items but keeps the row", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const item = await createTestItem({ context, entityTypeId: type.id, name: "R" });
    unwrap({ result: await execute({ operation: archiveItem, input: { id: item.id }, context }) });
    const list = unwrap({ result: await execute({ operation: listItems, input: {}, context }) });
    expect(list.items).toHaveLength(0);
    const get = await execute({ operation: getItem, input: { id: item.id }, context });
    expect(get.ok ? null : get.error.code).toBe("NOT_FOUND");
    const again = await execute({ operation: archiveItem, input: { id: item.id }, context });
    expect(again.ok ? null : again.error.code).toBe("NOT_FOUND");
    const raw = await context.db.item.findFirst({ where: { id: item.id, status: "ARCHIVED" } });
    expect(raw?.status).toBe("ARCHIVED");
  });

  it("archives a venue's items with it", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "V" }, context }),
    });
    const type = await createRoomType({ context });
    const entityTypeId = type.id;
    await createTestItem({ context, entityTypeId, venueId: venue.id, name: "R1" });
    await createTestItem({ context, entityTypeId, venueId: venue.id, name: "R2" });
    unwrap({
      result: await execute({ operation: archiveVenue, input: { id: venue.id }, context }),
    });
    expect(await context.db.item.count()).toBe(0);
    expect(await context.db.item.count({ where: { status: "ARCHIVED" } })).toBe(2);
  });
});
