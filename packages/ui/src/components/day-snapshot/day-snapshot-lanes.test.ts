import { describe, expect, it } from "vitest";
import { type DaySnapshotBlock, laneBlocks } from "./day-snapshot-lanes";

const bar = ({ id, start, end }: Pick<DaySnapshotBlock, "id" | "start" | "end">) =>
  ({ id, start, end, label: id, tone: "hard" }) as const;

describe("laneBlocks", () => {
  it("keeps bars that follow each other on one lane", () => {
    const { blocks, lanes } = laneBlocks({
      blocks: [bar({ id: "a", start: 0, end: 60 }), bar({ id: "b", start: 60, end: 90 })],
    });
    expect(lanes).toBe(1);
    expect(blocks.map(({ lane }) => lane)).toEqual([0, 0]);
  });

  it("moves an overlapping bar to the first free lane", () => {
    const { blocks, lanes } = laneBlocks({
      blocks: [
        bar({ id: "a", start: 0, end: 120 }),
        bar({ id: "b", start: 60, end: 90 }),
        bar({ id: "c", start: 100, end: 130 }),
        bar({ id: "d", start: 125, end: 140 }),
      ],
    });
    expect(lanes).toBe(2);
    expect(blocks.map(({ id, lane }) => [id, lane])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 1],
      ["d", 0],
    ]);
  });

  it("has one lane when empty", () => {
    expect(laneBlocks({ blocks: [] }).lanes).toBe(1);
  });
});
