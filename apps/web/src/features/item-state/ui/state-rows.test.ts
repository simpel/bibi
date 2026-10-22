import type { ItemStateDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toStateRows } from "./state-rows";

const state = ({ over }: { over: Partial<ItemStateDto> }): ItemStateDto => ({
  id: "a",
  organizationId: "o",
  entityTypeId: "t",
  name: "A",
  color: "#000000",
  position: 0,
  initial: false,
  hold: "NONE",
  inSheets: false,
  released: false,
  expires: false,
  transitionsTo: [],
  status: "ACTIVE",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  createdBy: null,
  ...over,
});

describe("toStateRows", () => {
  it("lists the flags that are on, with the hold kind", () => {
    const [row] = toStateRows({ states: [state({ over: { initial: true, hold: "SOFT" } })] });
    expect(row?.flags).toEqual(["initial", "hold"]);
  });

  it("names the transition targets and falls back to the id", () => {
    const rows = toStateRows({
      states: [
        state({ over: { id: "a", transitionsTo: ["b", "x"] } }),
        state({ over: { id: "b", name: "B" } }),
      ],
    });
    expect(rows[0]?.targets).toEqual(["B", "x"]);
  });
});
