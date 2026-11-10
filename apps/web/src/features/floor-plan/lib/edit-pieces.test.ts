import type { FloorElementKindDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { type DraftElement, effectiveOf, NO_OVERRIDES } from "./draft";
import { resetPiece, resizePiece, setAround, setSides } from "./edit-pieces";
import { buildTemplate } from "./layout-templates";

const base = {
  organizationId: "org",
  seats: 0,
  seatsTop: 0,
  seatsRight: 0,
  seatsBottom: 0,
  seatsLeft: 0,
  fixed: false,
  keepClearCm: null,
  swingDeg: null,
  status: "ACTIVE" as const,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  createdBy: null,
};

const table: FloorElementKindDto = {
  ...base,
  id: "table",
  name: "Table",
  shape: "RECT",
  widthCm: 180,
  depthCm: 80,
  seatsTop: 3,
  seatsBottom: 3,
};
const row: FloorElementKindDto = {
  ...base,
  id: "row",
  name: "Row",
  shape: "SEAT_ROW",
  widthCm: 300,
  depthCm: 50,
  seats: 6,
};
const round: FloorElementKindDto = {
  ...base,
  id: "round",
  name: "Round",
  shape: "ROUND",
  widthCm: 180,
  depthCm: 180,
  seats: 10,
};
const kinds = new Map([table, row, round].map((kind) => [kind.id, kind]));

const piece = ({ kindId }: { kindId: string }): DraftElement => ({
  ...NO_OVERRIDES,
  key: "a",
  kindId,
  xCm: 500,
  yCm: 400,
  rotationDeg: 0,
  label: null,
});

describe("editing pieces (ADR 0099)", () => {
  it("shortens a table and moves its chairs to the ends", () => {
    const short = resizePiece({ element: piece({ kindId: "table" }), kinds, widthCm: 120 });
    const ends = setSides({
      element: short,
      kinds,
      sides: { top: 2, bottom: 0, left: 1, right: 1 },
    });
    expect(effectiveOf({ element: ends, kinds })).toMatchObject({
      widthCm: 120,
      sides: { top: 2, right: 1, bottom: 0, left: 1 },
      seatCount: 4,
    });
    expect(resetPiece({ element: ends })).toMatchObject(NO_OVERRIDES);
  });

  it("keeps inheriting when a value equals the library's", () => {
    const same = setSides({ element: piece({ kindId: "table" }), kinds, sides: { top: 3 } });
    expect(same.seatsTop).toBeNull();
  });

  it("grows a row of chairs from its left end", () => {
    const longer = setAround({ element: piece({ kindId: "row" }), kinds, seats: 8 });
    expect(longer).toMatchObject({ seats: 8, widthCm: 400, xCm: 550 });
  });

  it("fills a room with round tables for the people asked, as far as they fit", () => {
    const room = {
      widthCm: 1000,
      depthCm: 800,
      outline: [
        [0, 0],
        [1000, 0],
        [1000, 800],
        [0, 800],
      ] as const,
    };
    const banquet = buildTemplate({ template: "banquet", people: 40, room, kinds, fixed: [] });
    expect(banquet).toHaveLength(4);
    expect(banquet.map((element) => element.label)).toEqual(["1", "2", "3", "4"]);
  });
});
