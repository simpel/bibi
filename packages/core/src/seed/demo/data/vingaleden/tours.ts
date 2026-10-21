import type { DemoItem } from "../../config-types";

/** Skippers, trips and add-ons (`docs/demo-seed.md`, Catalog). The boats are in `config.ts`. */
export const vingaledenTours: readonly DemoItem[] = [
  { type: "Skipper", name: "Kalle Ek", fields: { Certification: "Ship officer class VIII" } },
  { type: "Skipper", name: "Jonna Sand", fields: { Certification: "Boat license" } },
  {
    type: "Tour",
    name: "Sunset tour",
    fields: { "Departure harbor": "Saltholmen", "Distance nm": 18 },
    ...{ priceKr: 495, priceUnit: "PER_PERSON" },
    customisations: [
      {
        name: "Boat",
        options: [{ name: "M/S Kajan" }, { name: "M/S Tern" }],
      },
      {
        name: "Skipper",
        options: [{ name: "Kalle Ek" }, { name: "Jonna Sand" }],
      },
    ],
  },
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
  { type: "Add-on", name: "Blankets and rain gear", priceKr: 40, priceUnit: "PER_PERSON" },
  // Food without allergen lists: Vingaleden configures none.
  { type: "Add-on", name: "Coffee on board", priceKr: 35, priceUnit: "PER_PERSON" },
];
