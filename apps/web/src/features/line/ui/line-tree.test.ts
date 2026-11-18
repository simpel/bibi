import type { LineDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { lineTreePlaces } from "./line-tree";

const line = ({ id, parentLineId = null }: { id: string; parentLineId?: string | null }) =>
  ({ id, parentLineId }) as LineDto;

describe("lineTreePlaces", () => {
  it("marks a parent, its children and the last of them", () => {
    const lines = [
      line({ id: "room" }),
      line({ id: "buffet" }),
      line({ id: "fruit", parentLineId: "buffet" }),
      line({ id: "cake", parentLineId: "buffet" }),
    ];
    const places = lineTreePlaces({ lines });
    expect([...places.entries()]).toEqual([
      ["buffet", "parent"],
      ["fruit", "child"],
      ["cake", "lastChild"],
    ]);
  });
});
