import type { DemoConfig, DemoItem } from "../../config-types";

/** Vingaleden's configuration (`docs/demo-seed.md`): no food lists, no allergens. */
export const vingaledenConfig: Omit<DemoConfig, "items" | "venue" | "checks"> = {
  listTemplates: [],
  lists: [
    { name: "Harbor", values: ["Saltholmen", "Lilla Bommen", "Styrsö Bratten", "Vrångö"] },
    { name: "Accessibility", values: ["Wheelchair", "Walker", "Stroller"] },
    { name: "Life jacket", values: ["Child under 15 kg", "Child 15–40 kg"] },
    { name: "Certification", values: ["Ship officer class VIII", "Boat license"] },
  ],
  setups: [
    { name: "Seated", changeoverMinutes: 10 },
    { name: "Standing", changeoverMinutes: 5 },
    { name: "Deck reception", changeoverMinutes: 20 },
  ],
  types: [
    {
      base: "ITEM",
      name: "Boat",
      behaviours: ["BOOKABLE", "SETUPS", "PRICED"],
      fields: [
        { name: "Registration number", kind: "TEXT" },
        { name: "Toilet on board", kind: "BOOLEAN" },
        { name: "Max knots", kind: "NUMBER" },
      ],
    },
    {
      base: "ITEM",
      name: "Skipper",
      behaviours: ["BOOKABLE"],
      fields: [{ name: "Certification", kind: "CHOICE", list: "Certification" }],
    },
    {
      base: "ITEM",
      name: "Tour",
      behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
      fields: [
        { name: "Departure harbor", kind: "CHOICE", list: "Harbor" },
        { name: "Distance nm", kind: "NUMBER" },
      ],
    },
    { base: "ITEM", name: "Add-on", behaviours: ["PRICED"] },
    { base: "CUSTOMER", name: "Company", fields: [{ name: "Org no.", kind: "TEXT" }] },
    { base: "CUSTOMER", name: "Private" },
    { base: "CONTACT", name: "Contact person" },
    { base: "BOOKING", name: "Charter" },
    { base: "BOOKING", name: "Round trip" },
  ],
};

/** The fleet (`docs/demo-seed.md`, Catalog). Skippers and tours are in `tours.ts`. */
export const vingaledenBoats: readonly DemoItem[] = [
  {
    type: "Boat",
    name: "M/S Kajan",
    fields: { "Toilet on board": true },
    ...{ priceKr: 3200, priceUnit: "PER_HOUR" },
    setups: { Seated: 48, Standing: 80, "Deck reception": 60 },
  },
  {
    type: "Boat",
    name: "M/S Tern",
    fields: { "Toilet on board": true },
    ...{ priceKr: 2100, priceUnit: "PER_HOUR" },
    setups: { Seated: 24, Standing: 40 },
  },
  {
    type: "Boat",
    name: "RIB Snabben",
    fields: { "Toilet on board": false, "Max knots": 40 },
    ...{ priceKr: 2600, priceUnit: "PER_HOUR" },
    setups: { Seated: 12 },
  },
];
