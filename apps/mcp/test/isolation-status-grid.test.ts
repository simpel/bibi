import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

/** The organization's seeded line, a non-closing status and a set grid cell for the line's type. */
async function seedGrid({ client }: { client: Client }) {
  const seed = await seedProgram({ client });
  const item = await call({ client, name: "item_get", args: { id: seed.itemId } });
  const entityTypeId: string = item.data.entityTypeId;
  const states = await call({ client, name: "itemState_list", args: { entityTypeId } });
  const stateId: string = states.data.items[0].id;
  const statuses = await call({ client, name: "ticketStatus_list", args: {} });
  const ticketStatus = statuses.data.items.find((row: { closes: boolean }) => !row.closes);
  const args = { statusId: ticketStatus.id, entityTypeId, stateId };
  const cell = await call({ client, name: "statusGrid_setCell", args });
  expect(cell.isError, JSON.stringify(cell.data)).toBe(false);
  return { ...seed, ...args };
}

describe("cross-organization isolation: the status grid and line overrides", () => {
  it("hides one organization's grid and refuses its ids in another's cells and lines", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seedA = await seedGrid({ client: a });
    const seedB = await seedGrid({ client: b });
    const followed = await call({
      client: b,
      name: "line_followStatus",
      args: { lineId: seedA.lineId },
    });
    expect(followed.data.code).toBe("NOT_FOUND");
    const own = { statusId: seedB.statusId, entityTypeId: seedB.entityTypeId, stateId: null };
    for (const args of [
      { ...own, statusId: seedA.statusId },
      { ...own, entityTypeId: seedA.entityTypeId },
      { ...own, stateId: seedA.stateId },
    ]) {
      const refused = await call({ client: b, name: "statusGrid_setCell", args });
      expect(refused.data.code, JSON.stringify(args)).toBe("VALIDATION");
    }
    const grid = await call({ client: b, name: "statusGrid_get", args: {} });
    const cellIds = grid.data.cells.map((cell: { stateId: string }) => cell.stateId);
    expect(cellIds).toEqual([seedB.stateId]);
    const foreign = await call({
      client: b,
      name: "statusGrid_get",
      args: { statusId: seedA.statusId },
    });
    expect(foreign.data.cells).toEqual([]);
    const mine = await call({ client: a, name: "statusGrid_get", args: {} });
    expect(mine.data.cells.map((cell: { stateId: string }) => cell.stateId)).toEqual([
      seedA.stateId,
    ]);
    const imported = await call({
      client: b,
      name: "statusGrid_importTemplate",
      args: { template: "default" },
    });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const after = await call({ client: a, name: "statusGrid_get", args: {} });
    expect(after.data.cells).toEqual(mine.data.cells);
  });
});
