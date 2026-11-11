import { describe, expect, it } from "vitest";
import { createItem, execute, getFloorPlan, isSimpleOutline, saveFloorPlan } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

const L_SHAPE: [number, number][] = [
  [0, 0],
  [1200, 0],
  [1200, 500],
  [700, 500],
  [700, 900],
  [0, 900],
];

describe("room outlines", () => {
  it("accepts any simple shape and refuses crossing or doubled corners", () => {
    expect(isSimpleOutline({ outline: L_SHAPE })).toBe(true);
    const bowtie: [number, number][] = [
      [0, 0],
      [100, 100],
      [100, 0],
      [0, 100],
    ];
    expect(isSimpleOutline({ outline: bowtie })).toBe(false);
    const doubled: [number, number][] = [
      [0, 0],
      [100, 0],
      [100, 0],
      [0, 100],
    ];
    expect(isSimpleOutline({ outline: doubled })).toBe(false);
    const flat: [number, number][] = [
      [0, 0],
      [50, 0],
      [100, 0],
    ];
    expect(isSimpleOutline({ outline: flat })).toBe(false);
  });

  it("saves an L-shaped room and refuses walls that cross or leave the size", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const item = unwrap({
      result: await execute({
        operation: createItem,
        input: {
          entityTypeId: type.id,
          name: "Vinkeln",
        },
        context,
      }),
    });
    const base = { itemId: item.id, widthCm: 1200, depthCm: 900, minAisleCm: null, elements: [] };
    unwrap({
      result: await execute({
        operation: saveFloorPlan,
        input: { ...base, expectedVersion: 0, outline: L_SHAPE },
        context,
      }),
    });
    const plan = unwrap({
      result: await execute({ operation: getFloorPlan, input: { itemId: item.id }, context }),
    });
    expect(plan.outline).toEqual(L_SHAPE);
    const crossing = await execute({
      operation: saveFloorPlan,
      input: {
        ...base,
        expectedVersion: 1,
        outline: [
          [0, 0],
          [1200, 900],
          [1200, 0],
          [0, 900],
        ],
      },
      context,
    });
    expect(errorCode({ result: crossing })).toBe("VALIDATION");
    const outside = await execute({
      operation: saveFloorPlan,
      input: { ...base, expectedVersion: 1, widthCm: 1000, outline: L_SHAPE },
      context,
    });
    expect(errorCode({ result: outside })).toBe("VALIDATION");
  });
});
