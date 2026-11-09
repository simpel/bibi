import { describe, expect, it } from "vitest";
import {
  clockwise,
  insertCorner,
  moveCorner,
  outlineSize,
  rectangle,
  removeCorner,
  scaleOutline,
} from "./outline-edit";

const room = rectangle({ widthCm: 1000, depthCm: 800 });

describe("editing a room's walls", () => {
  it("turns a rectangle into an L by adding and moving corners", () => {
    const one = insertCorner({ outline: room, after: 1, x: 1000, y: 400 });
    const two = one && insertCorner({ outline: one, after: 2, x: 600, y: 400 });
    const lShape = two && moveCorner({ outline: two, index: 4, x: 600, y: 800 });
    expect(lShape).toEqual([
      [0, 0],
      [1000, 0],
      [1000, 400],
      [600, 400],
      [600, 800],
      [0, 800],
    ]);
    expect(lShape && outlineSize({ outline: lShape })).toEqual({ widthCm: 1000, depthCm: 800 });
  });

  it("refuses moves that make walls cross and keeps corners on the plan", () => {
    expect(moveCorner({ outline: room, index: 0, x: 500, y: 900 })).toBeNull();
    expect(moveCorner({ outline: room, index: 0, x: -50, y: -10 })?.[0]).toEqual([0, 0]);
  });

  it("deletes corners down to a triangle", () => {
    const triangle = removeCorner({ outline: room, index: 3 });
    expect(triangle).toHaveLength(3);
    expect(triangle && removeCorner({ outline: triangle, index: 0 })).toBeNull();
  });

  it("stretches the shape to a new size and stores it clockwise", () => {
    expect(scaleOutline({ outline: room, widthCm: 500, depthCm: 1600 })).toEqual(
      rectangle({ widthCm: 500, depthCm: 1600 }),
    );
    expect(clockwise({ outline: [...room].reverse() })).toEqual(room);
  });
});
