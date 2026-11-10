import type { DemoFloorPlan } from "../../config-types";

const round = "Round table Ø150";

/** M/S Kajan's saloon: six round tables for 48, the capacity taken from the seats. */
export const vingaledenFloorPlans: readonly DemoFloorPlan[] = [
  {
    item: "M/S Kajan",
    widthCm: 1100,
    depthCm: 620,
    fixed: [{ kind: "Door", x: 1100, y: 310 }],
    layouts: [
      {
        name: "Seated",
        setup: "Seated",
        useSeats: true,
        pieces: [200, 500, 800].flatMap((x, column) =>
          [160, 460].map((y, row) => ({ kind: round, x, y, label: String(row * 3 + column + 1) })),
        ),
      },
    ],
  },
];
