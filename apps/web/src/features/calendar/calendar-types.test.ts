import { describe, expect, it } from "vitest";
import { ALL_TYPES, selectSpaces } from "./calendar-types";

const space = ({ id, type }: { id: string; type: string }) => ({
  id,
  name: id,
  venueId: null,
  entityTypeId: type,
});
const spaces = [
  space({ id: "r1", type: "room" }),
  space({ id: "r2", type: "room" }),
  space({ id: "g1", type: "guide" }),
  space({ id: "w1", type: "kit" }),
];
const types = [
  { id: "room", name: "Conference room" },
  { id: "guide", name: "Guide" },
  { id: "kit", name: "Equipment" },
  { id: "unused", name: "Boat" },
];

describe("selectSpaces", () => {
  it("defaults to the type with the most spaces and lists only used types by name", () => {
    const selected = selectSpaces({ spaces, types, typeId: undefined });
    expect(selected.typeId).toBe("room");
    expect(selected.spaces.map(({ id }) => id)).toEqual(["r1", "r2"]);
    expect(selected.types.map(({ name }) => name)).toEqual([
      "Conference room",
      "Equipment",
      "Guide",
    ]);
  });

  it("uses the type from the URL and falls back when it has no spaces", () => {
    expect(selectSpaces({ spaces, types, typeId: "guide" }).spaces.map(({ id }) => id)).toEqual([
      "g1",
    ]);
    expect(selectSpaces({ spaces, types, typeId: "unused" }).typeId).toBe("room");
  });

  it("shows every space for `all`", () => {
    const selected = selectSpaces({ spaces, types, typeId: ALL_TYPES });
    expect(selected.typeId).toBeUndefined();
    expect(selected.spaces).toHaveLength(4);
  });
});
