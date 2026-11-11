import type { DemoFloorPlan } from "../../config-types";

const table = "Table 180 × 80";
const round = "Round table Ø180";
/** Chairs on the outside of a U only (ADR 0099: own chairs per side). */
const outside = { seatsTop: 0, seatsBottom: 3 };

/**
 * Hönö drawn to scale with a door and a window: a U-shape for 24 and two banquets, six round
 * tables (60) and nine long tables (54), so the setup has two layouts (ADR 0102). Knippla is an
 * L-shaped room (its walls only), so the editor shows a room that is not a rectangle.
 */
export const lindholmenFloorPlans: readonly DemoFloorPlan[] = [
  {
    item: "Hönö",
    widthCm: 1200,
    depthCm: 750,
    fixed: [
      { kind: "Screen", x: 600, y: 8 },
      { kind: "Door", x: 1150, y: 750, emergencyExit: true },
      { kind: "Window", x: 0, y: 375 },
    ],
    layouts: [
      {
        name: "U-shape",
        pieces: [
          { kind: table, x: 200, y: 290, rotation: 90, ...outside },
          { kind: table, x: 200, y: 470, rotation: 90, ...outside },
          { kind: table, x: 1000, y: 290, rotation: 270, ...outside },
          { kind: table, x: 1000, y: 470, rotation: 270, ...outside },
          ...[330, 510, 690, 870].map((x) => ({ kind: table, x, y: 600, ...outside })),
        ],
      },
      {
        name: "Banquet",
        pieces: [230, 580, 930].flatMap((x, column) =>
          [230, 560].map((y, row) => ({ kind: round, x, y, label: String(row * 3 + column + 1) })),
        ),
      },
      {
        name: "Banquet, long tables",
        pieces: [250, 550, 850].flatMap((x) => [180, 400, 620].map((y) => ({ kind: table, x, y }))),
      },
    ],
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
    fixed: [{ kind: "Door", x: 400, y: 1100 }],
    layouts: [],
  },
];
