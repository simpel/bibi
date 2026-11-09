import type { DemoFloorPlan } from "../../config-types";

const table = "Table 180 × 80";
const round = "Round table Ø180";
/** Chairs on the outside of a U only (ADR 0099: own chairs per side). */
const outside = { seatsTop: 0, seatsBottom: 3 };

/**
 * Hönö drawn to scale: a U-shape for 24 and a banquet of six round tables. Knippla is an L-shaped
 * room (its walls only), so the editor shows a room that is not a rectangle.
 */
export const lindholmenFloorPlans: readonly DemoFloorPlan[] = [
  {
    item: "Hönö",
    widthCm: 1200,
    depthCm: 750,
    fixed: [
      { kind: "Screen", x: 600, y: 8 },
      { kind: "Door", x: 1150, y: 740, rotation: 180 },
    ],
    layouts: {
      "U-shape": {
        pieces: [
          { kind: table, x: 200, y: 290, rotation: 90, ...outside },
          { kind: table, x: 200, y: 470, rotation: 90, ...outside },
          { kind: table, x: 1000, y: 290, rotation: 270, ...outside },
          { kind: table, x: 1000, y: 470, rotation: 270, ...outside },
          ...[330, 510, 690, 870].map((x) => ({ kind: table, x, y: 600, ...outside })),
        ],
      },
      Banquet: {
        pieces: [230, 580, 930].flatMap((x, column) =>
          [230, 560].map((y, row) => ({ kind: round, x, y, label: String(row * 3 + column + 1) })),
        ),
      },
    },
  },
  {
    item: "Knippla (workshop)",
    widthCm: 1400,
    depthCm: 1100,
    outline: [
      [0, 0],
      [1400, 0],
      [1400, 600],
      [800, 600],
      [800, 1100],
      [0, 1100],
    ],
    fixed: [{ kind: "Door", x: 400, y: 1090, rotation: 180 }],
    layouts: {},
  },
];
