import { describe, expect, it } from "vitest";
import {
  archiveFloorElementKind,
  archiveLayout,
  createItem,
  createLayout,
  type ExecuteContext,
  execute,
  getFloorPlan,
  getItem,
  getLayout,
  importFloorElementKinds,
  listFloorElementKinds,
  saveFloorPlan,
  saveLayout,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

type Ctx = { context: ExecuteContext };

const RECTANGLE: [number, number][] = [
  [0, 0],
  [1000, 0],
  [1000, 800],
  [0, 800],
];

/** A 10 × 8 m room with a people limit and the starter library. */
async function room({ context, maxPeople = 100 }: Ctx & { maxPeople?: number }) {
  const type = await createRoomType({ context });
  const input = { entityTypeId: type.id, name: "Sjöstugan", maxPeople };
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
    return found.id;
  };
  return { item, kind };
}

type LayoutInput = Ctx & { itemId: string; name: string; capacity?: number | null };

/** A new empty layout of the room. */
async function newLayout({ context, ...input }: LayoutInput) {
  return unwrap({ result: await execute({ operation: createLayout, input, context }) });
}

/** The room's plan saved with these fixed pieces. */
async function savePlan({
  context,
  itemId,
  version,
  elements,
}: Ctx & {
  itemId: string;
  version: number;
  elements: { kindId: string; xCm: number; yCm: number; emergencyExit?: boolean }[];
}) {
  const input = {
    ...{ itemId, expectedVersion: version, widthCm: 1000, depthCm: 800 },
    ...{ outline: RECTANGLE, minAisleCm: null, elements },
  };
  return execute({ operation: saveFloorPlan, input, context });
}

describe("floor plans and layouts (ADR 0099, 0102, 0103)", () => {
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

  it("derives a layout's capacity from its seats unless one is typed", async () => {
    const context = testContext();
    const { item, kind } = await room({ context });
    const drawn = await newLayout({ context, itemId: item.id, name: "Banquet" });
    expect(drawn).toMatchObject({ seatCount: 0, effectiveCapacity: null, capacitySource: "NONE" });
    const saved = unwrap({
      result: await execute({
        operation: saveLayout,
        input: {
          id: drawn.id,
          expectedVersion: 1,
          description: "Dinner with speeches",
          setupMinutes: 45,
          elements: [
            { kindId: kind({ name: "Round table Ø180" }), xCm: 300, yCm: 300 },
            // A long table shortened to 120 cm, two chairs on top, none below, one on each end.
            {
              kindId: kind({ name: "Table 180 × 80" }),
              ...{ xCm: 700, yCm: 300, widthCm: 120 },
              ...{ seatsTop: 2, seatsBottom: 0, seatsLeft: 1, seatsRight: 1 },
            },
          ],
        },
        context,
      }),
    });
    expect(saved).toMatchObject({
      version: 2,
      seatCount: 14,
      effectiveCapacity: 14,
      capacitySource: "LAYOUT",
      description: "Dinner with speeches",
      setupMinutes: 45,
    });
    const typed = unwrap({
      result: await execute({
        operation: saveLayout,
        input: { id: drawn.id, expectedVersion: 2, capacity: 12, elements: [] },
        context,
      }),
    });
    expect(typed).toMatchObject({ effectiveCapacity: 12, capacitySource: "MANUAL" });
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(read.layouts).toEqual([
      { layoutId: drawn.id, name: "Banquet", effectiveCapacity: 12, capacitySource: "MANUAL" },
    ]);
  });

  it("refuses a stale version, a taken name and the wrong kind of piece", async () => {
    const context = testContext();
    const { item, kind } = await room({ context });
    const drawn = await newLayout({ context, itemId: item.id, name: "A" });
    await newLayout({ context, itemId: item.id, name: "B" });
    const base = { id: drawn.id, elements: [] };
    unwrap({
      result: await execute({
        operation: saveLayout,
        input: { ...base, expectedVersion: 1 },
        context,
      }),
    });
    const stale = await execute({
      operation: saveLayout,
      input: { ...base, expectedVersion: 1 },
      context,
    });
    expect(errorCode({ result: stale })).toBe("CONFLICT");
    const taken = await execute({
      operation: saveLayout,
      input: { ...base, expectedVersion: 2, name: "b" },
      context,
    });
    expect(errorCode({ result: taken })).toBe("CONFLICT");
    const door = await execute({
      operation: saveLayout,
      input: {
        ...base,
        expectedVersion: 2,
        elements: [{ kindId: kind({ name: "Door" }), xCm: 0, yCm: 0 }],
      },
      context,
    });
    expect(errorCode({ result: door })).toBe("VALIDATION");
  });

  it("snaps doors to a wall and warns about pieces outside the walls or in a door's swing", async () => {
    const context = testContext();
    const { item, kind } = await room({ context });
    // Dropped near the bottom wall: it snaps onto the wall and swings into the room.
    const plan = unwrap({
      result: await savePlan({
        context,
        itemId: item.id,
        version: 0,
        elements: [{ kindId: kind({ name: "Door" }), xCm: 500, yCm: 760 }],
      }),
    });
    expect(plan.elements[0]).toMatchObject({
      ...{ xCm: 500, yCm: 800, rotationDeg: 180, shape: "DOOR" },
      ...{ effectiveSwingDeg: 90, seatCount: 0, emergencyExit: false },
    });
    const drawn = await newLayout({ context, itemId: item.id, name: "A" });
    const layout = unwrap({
      result: await execute({
        operation: saveLayout,
        input: {
          id: drawn.id,
          expectedVersion: 1,
          elements: [
            { kindId: kind({ name: "Buffet" }), xCm: 500, yCm: 720 },
            { kindId: kind({ name: "Stage" }), xCm: 1000, yCm: 100 },
          ],
        },
        context,
      }),
    });
    expect(layout.issues.map((issue) => issue.kind).sort()).toEqual([
      "KEEP_CLEAR",
      "OUTSIDE_OUTLINE",
    ]);
  });

  it("refuses a layout that blocks an emergency exit, and an exit that a layout blocks", async () => {
    const context = testContext();
    const { item, kind } = await room({ context });
    const door = { kindId: kind({ name: "Door" }), xCm: 500, yCm: 800 };
    unwrap({ result: await savePlan({ context, itemId: item.id, version: 0, elements: [door] }) });
    const drawn = await newLayout({ context, itemId: item.id, name: "A" });
    // 1.2 m from the wall: outside the door's 90 cm swing, inside an exit's 150 cm zone.
    const buffet = { kindId: kind({ name: "Buffet" }), xCm: 500, yCm: 650 };
    unwrap({
      result: await execute({
        operation: saveLayout,
        input: { id: drawn.id, expectedVersion: 1, elements: [buffet] },
        context,
      }),
    });
    const marked = await savePlan({
      context,
      itemId: item.id,
      version: 1,
      elements: [{ ...door, emergencyExit: true }],
    });
    expect(errorCode({ result: marked })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: saveLayout,
        input: { id: drawn.id, expectedVersion: 2, elements: [] },
        context,
      }),
    });
    unwrap({
      result: await savePlan({
        context,
        itemId: item.id,
        version: 1,
        elements: [{ ...door, emergencyExit: true }],
      }),
    });
    const blocked = await execute({
      operation: saveLayout,
      input: { id: drawn.id, expectedVersion: 3, elements: [buffet] },
      context,
    });
    expect(errorCode({ result: blocked })).toBe("VALIDATION");
    const kept = unwrap({
      result: await execute({ operation: getLayout, input: { id: drawn.id }, context }),
    });
    expect(kept).toMatchObject({ version: 3, elements: [] });
  });

  it("holds a layout and the room to the people limit", async () => {
    const context = testContext();
    const { item } = await room({ context, maxPeople: 40 });
    const over = await execute({
      operation: createLayout,
      input: { itemId: item.id, name: "Big", capacity: 41 },
      context,
    });
    expect(errorCode({ result: over })).toBe("VALIDATION");
    await newLayout({ context, itemId: item.id, name: "Classroom", capacity: 30 });
    const lowered = await execute({
      operation: updateItem,
      input: { id: item.id, maxPeople: 25 },
      context,
    });
    expect(errorCode({ result: lowered })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: item.id, maxPeople: 30 },
        context,
      }),
    });
  });

  it("copies and archives layouts and hides them from other organizations", async () => {
    const context = testContext();
    const { item, kind } = await room({ context });
    const round = kind({ name: "Round table Ø180" });
    const small = await newLayout({ context, itemId: item.id, name: "60" });
    unwrap({
      result: await execute({
        operation: saveLayout,
        input: {
          id: small.id,
          expectedVersion: 1,
          setupMinutes: 30,
          elements: [{ kindId: round, xCm: 300, yCm: 300 }],
        },
        context,
      }),
    });
    const copy = unwrap({
      result: await execute({
        operation: createLayout,
        input: { itemId: item.id, name: "80", copyFromId: small.id },
        context,
      }),
    });
    expect(copy).toMatchObject({ seatCount: 10, setupMinutes: 30 });
    const archived = await execute({
      operation: archiveFloorElementKind,
      input: { id: round },
      context,
    });
    expect(errorCode({ result: archived })).toBe("CONFLICT");
    unwrap({
      result: await execute({ operation: archiveLayout, input: { id: copy.id }, context }),
    });
    const plan = unwrap({
      result: await execute({ operation: getFloorPlan, input: { itemId: item.id }, context }),
    });
    expect(plan.layouts.map((layout) => layout.name)).toEqual(["60"]);
    const foreign = await execute({
      operation: getLayout,
      input: { id: small.id },
      context: testContext(),
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
  });
});
