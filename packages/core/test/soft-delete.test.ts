import { describe, expect, it } from "vitest";
import {
  archiveRoom,
  archiveVenue,
  createRoom,
  createVenue,
  execute,
  getRoom,
  listRooms,
} from "../src/index";
import { testContext, unwrap } from "./helpers";

describe("soft delete", () => {
  it("hides archived rooms but keeps the row", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "V" }, context }),
    });
    const room = unwrap({
      result: await execute({
        operation: createRoom,
        input: { venueId: venue.id, name: "R" },
        context,
      }),
    });
    unwrap({ result: await execute({ operation: archiveRoom, input: { id: room.id }, context }) });
    const list = unwrap({ result: await execute({ operation: listRooms, input: {}, context }) });
    expect(list.items).toHaveLength(0);
    const get = await execute({ operation: getRoom, input: { id: room.id }, context });
    expect(get.ok ? null : get.error.code).toBe("NOT_FOUND");
    const again = await execute({ operation: archiveRoom, input: { id: room.id }, context });
    expect(again.ok ? null : again.error.code).toBe("NOT_FOUND");
    const raw = await context.db.room.findFirst({ where: { id: room.id, status: "ARCHIVED" } });
    expect(raw?.status).toBe("ARCHIVED");
  });

  it("archives a venue's rooms with it", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "V" }, context }),
    });
    await execute({ operation: createRoom, input: { venueId: venue.id, name: "R1" }, context });
    await execute({ operation: createRoom, input: { venueId: venue.id, name: "R2" }, context });
    unwrap({
      result: await execute({ operation: archiveVenue, input: { id: venue.id }, context }),
    });
    expect(await context.db.room.count()).toBe(0);
    expect(await context.db.room.count({ where: { status: "ARCHIVED" } })).toBe(2);
  });
});
