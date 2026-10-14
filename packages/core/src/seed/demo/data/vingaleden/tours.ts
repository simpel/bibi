import type { DemoItem } from "../../config-types";

/**
 * Skippers and the tour without choice groups (`docs/demo-seed.md`, Catalog). The Sunset tour
 * and the add-ons follow with choice groups (slice 3).
 */
export const vingaledenTours: readonly DemoItem[] = [
  { type: "Skipper", name: "Kalle Ek", fields: { Certification: "Ship officer class VIII" } },
  { type: "Skipper", name: "Jonna Sand", fields: { Certification: "Boat license" } },
  {
    type: "Tour",
    name: "Lighthouse tour to Vinga",
    fields: { "Departure harbor": "Saltholmen", "Distance nm": 14 },
    ...{ priceKr: 650, priceUnit: "PER_PERSON" },
    parts: [
      { name: "RIB Snabben", durationMinutes: 90 },
      { name: "Jonna Sand", durationMinutes: 90 },
    ],
  },
];
