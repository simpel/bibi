import { describe, expect, it } from "vitest";
import {
  archiveFloorElementKind,
  archiveSetupLayout,
  createItem,
  createSetup,
  createSetupLayout,
  type ExecuteContext,
  execute,
  getFloorPlan,
  getItem,
  getSetupLayout,
  importFloorElementKinds,
  listFloorElementKinds,
  saveFloorPlan,
  saveSetupLayout,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

type Setup = { context: ExecuteContext };

/** A room with two setups (one typed capacity, one empty) and the starter library. */
async function room({ context }: Setup) {
  const type = await createRoomType({ context });
  const banquet = unwrap({
    result: await execute({ operation: createSetup, input: { name: "Banquet" }, context }),
  });
  const theatre = unwrap({
    result: await execute({ operation: createSetup, input: { name: "Theatre" }, context }),
  });
  const setups = [
    { setupId: banquet.id, capacity: null },
    { setupId: theatre.id, capacity: 120 },
  ];
  const input = { entityTypeId: type.id, name: "Sjöstugan", setups };
  const item = unwrap({ result: await execute({ operation: createItem, input, context }) });
  const template = { template: "conference-banquet" as const };
  unwrap({
    result: await execute({ operation: importFloorElementKinds, input: template, context }),
  });
  const kinds = unwrap({
    result: await execute({ operation: listFloorElementKinds, input: { limit: 100 }, context }),
  });
  const kind = ({ name }: { name: string }) => {
    const found = kinds.items.find((k) => k.name === name);
    if (!found) throw new Error(`kind ${name}`);
    return found;
  };
  return { item, banquet, theatre, kind };
}

type LayoutInput = Setup & { itemId: string; setupId: string; name: string };

/** A new empty layout of the setup in the item. */
async function newLayout({ context, itemId, setupId, name }: LayoutInput) {
  const input = { itemId, setupId, name };
  return unwrap({ result: await execute({ operation: createSetupLayout, input, context }) });
}

describe("floor plans and setup layouts (ADR 0099, 0102)", () => {
  it("imports the starter library once", async () => {
    const context = testContext();
    await room({ context });
    const again = unwrap({
      result: await execute({
        operation: importFloorElementKinds,
        input: { template: "conference-banquet" },
        context,
      }),
    });
    expect(again).toEqual({ created: 0, skipped: 13 });
  });

  it("derives seats per side and capacity from the layout", async () => {
    const context = testContext();
    const { item, banquet, kind } = await room({ context });
    const table = kind({ name: "Table 180 × 80" });
    const drawn = await newLayout({ context, itemId: item.id, setupId: banquet.id, name: "A" });
    const saved = unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: {
          id: drawn.id,
          expectedVersion: 1,
          elements: [
            { kindId: kind({ name: "Round table Ø180" }).id, xCm: 300, yCm: 300 },
            // A long table shortened to 120 cm, two chairs on top, none below, one on each end.
            {
              kindId: table.id,
              xCm: 700,
              yCm: 300,
              widthCm: 120,
              seatsTop: 2,
              seatsBottom: 0,
              seatsLeft: 1,
              seatsRight: 1,
            },
          ],
        },
        context,
      }),
    });
    expect(saved.version).toBe(2);
    expect(saved.elements[1]).toMatchObject({
      effectiveWidthCm: 120,
      effectiveDepthCm: 80,
      effectiveSides: { top: 2, right: 1, bottom: 0, left: 1 },
      seatCount: 4,
    });
    expect(saved.seatCount).toBe(14);
    expect(saved).toMatchObject({
      capacity: null,
      effectiveCapacity: 14,
      capacitySource: "LAYOUT",
    });
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(read.setups.find((s) => s.setupId === banquet.id)).toMatchObject({
      effectiveCapacity: 14,
    });
  });

  it("refuses a stale version and the wrong kind of piece", async () => {
    const context = testContext();
    const { item, theatre, kind } = await room({ context });
    const drawn = await newLayout({ context, itemId: item.id, setupId: theatre.id, name: "A" });
    const base = { id: drawn.id, elements: [] };
    unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: { ...base, expectedVersion: 1 },
        context,
      }),
    });
    const stale = await execute({
      operation: saveSetupLayout,
      input: { ...base, expectedVersion: 1 },
      context,
    });
    expect(errorCode({ result: stale })).toBe("CONFLICT");
    const door = await execute({
      operation: saveSetupLayout,
      input: {
        ...base,
        expectedVersion: 2,
        elements: [{ kindId: kind({ name: "Door" }).id, xCm: 0, yCm: 0 }],
      },
      context,
    });
    expect(errorCode({ result: door })).toBe("VALIDATION");
  });

  it("warns about pieces outside the walls and in front of a door", async () => {
    const context = testContext();
    const { item, theatre, kind } = await room({ context });
    unwrap({
      result: await execute({
        operation: saveFloorPlan,
        input: {
          itemId: item.id,
          expectedVersion: 0,
          widthCm: 1000,
          depthCm: 800,
          outline: [
            [0, 0],
            [1000, 0],
            [1000, 800],
            [0, 800],
          ],
          minAisleCm: null,
          // Dropped near the bottom wall: it snaps onto the wall and swings into the room.
          elements: [{ kindId: kind({ name: "Door" }).id, xCm: 500, yCm: 760 }],
        },
        context,
      }),
    });
    const drawn = await newLayout({ context, itemId: item.id, setupId: theatre.id, name: "A" });
    const layout = unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: {
          id: drawn.id,
          expectedVersion: 1,
          elements: [
            { kindId: kind({ name: "Buffet" }).id, xCm: 500, yCm: 700 },
            { kindId: kind({ name: "Stage" }).id, xCm: 1000, yCm: 100 },
          ],
        },
        context,
      }),
    });
    expect(layout.issues.map((issue) => issue.kind).sort()).toEqual([
      "KEEP_CLEAR",
      "OUTSIDE_OUTLINE",
    ]);
    expect(layout).toMatchObject({ effectiveCapacity: 120, capacitySource: "MANUAL" });
    const plan = unwrap({
      result: await execute({ operation: getFloorPlan, input: { itemId: item.id }, context }),
    });
    expect(plan.version).toBe(1);
    expect(plan.elements[0]).toMatchObject({
      xCm: 500,
      yCm: 800,
      rotationDeg: 180,
      shape: "DOOR",
      effectiveSwingDeg: 90,
      seatCount: 0,
    });
    expect(plan.setups).toHaveLength(2);
    expect(plan.layouts).toHaveLength(1);
  });

  it("keeps a kind that is in use and hides plans from other organizations", async () => {
    const context = testContext();
    const { item, banquet, kind } = await room({ context });
    const round = kind({ name: "Round table Ø180" });
    const drawn = await newLayout({ context, itemId: item.id, setupId: banquet.id, name: "A" });
    unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: {
          id: drawn.id,
          expectedVersion: 1,
          elements: [{ kindId: round.id, xCm: 300, yCm: 300 }],
        },
        context,
      }),
    });
    const archived = await execute({
      operation: archiveFloorElementKind,
      input: { id: round.id },
      context,
    });
    expect(errorCode({ result: archived })).toBe("CONFLICT");
    const other = testContext();
    const foreign = await execute({
      operation: getSetupLayout,
      input: { id: drawn.id },
      context: other,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
  });

  it("takes a setup's capacity from its largest layout, copies, renames and archives", async () => {
    const context = testContext();
    const { item, banquet, kind } = await room({ context });
    const round = kind({ name: "Round table Ø180" }).id;
    const small = await newLayout({ context, itemId: item.id, setupId: banquet.id, name: "60" });
    const tables = ({ count }: { count: number }) =>
      Array.from({ length: count }, (_, index) => ({
        kindId: round,
        xCm: 150 + index * 250,
        yCm: 300,
      }));
    unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: { id: small.id, expectedVersion: 1, elements: tables({ count: 2 }) },
        context,
      }),
    });
    const copy = unwrap({
      result: await execute({
        operation: createSetupLayout,
        input: { itemId: item.id, setupId: banquet.id, name: "80", copyFromId: small.id },
        context,
      }),
    });
    expect(copy.seatCount).toBe(20);
    const big = unwrap({
      result: await execute({
        operation: saveSetupLayout,
        input: { id: copy.id, expectedVersion: 1, elements: tables({ count: 3 }) },
        context,
      }),
    });
    expect(big).toMatchObject({ seatCount: 30, effectiveCapacity: 30, capacitySource: "LAYOUT" });
    const taken = await execute({
      operation: saveSetupLayout,
      input: { id: copy.id, expectedVersion: 2, name: "60", elements: tables({ count: 3 }) },
      context,
    });
    expect(errorCode({ result: taken })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: archiveSetupLayout, input: { id: copy.id }, context }),
    });
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(read.setups.find((s) => s.setupId === banquet.id)).toMatchObject({
      effectiveCapacity: 20,
    });
  });
});
