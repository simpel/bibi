import type { DemoConfig, DemoItem } from "../../config-types";

/** Vingaleden's configuration (`docs/demo-seed.md`): no food lists, no allergens. */
export const vingaledenConfig: Omit<DemoConfig, "items" | "venue" | "checks"> = {
  listTemplates: [],
  lists: [
    { name: "Hamn", values: ["Saltholmen", "Lilla Bommen", "Styrsö Bratten", "Vrångö"] },
    { name: "Tillgänglighet", values: ["Rullstol", "Rollator", "Barnvagn"] },
    { name: "Flytväst", values: ["Barn under 15 kg", "Barn 15–40 kg"] },
    { name: "Behörighet", values: ["Fartygsbefäl klass VIII", "Förarbevis"] },
  ],
  setups: [
    { name: "Sittande", changeoverMinutes: 10 },
    { name: "Stående", changeoverMinutes: 5 },
    { name: "Mingel på däck", changeoverMinutes: 20 },
  ],
  types: [
    {
      base: "ITEM",
      name: "Båt",
      behaviours: ["BOOKABLE", "SETUPS", "PRICED"],
      fields: [
        { name: "Registreringsnummer", kind: "TEXT" },
        { name: "Toalett ombord", kind: "BOOLEAN" },
        { name: "Max knop", kind: "NUMBER" },
      ],
    },
    {
      base: "ITEM",
      name: "Skeppare",
      behaviours: ["BOOKABLE"],
      fields: [{ name: "Behörighet", kind: "CHOICE", list: "Behörighet" }],
    },
    {
      base: "ITEM",
      name: "Tur",
      behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
      fields: [
        { name: "Avgångshamn", kind: "CHOICE", list: "Hamn" },
        { name: "Sträcka nm", kind: "NUMBER" },
      ],
    },
    { base: "ITEM", name: "Tillägg", behaviours: ["PRICED"] },
    { base: "CUSTOMER", name: "Företag", fields: [{ name: "Orgnr", kind: "TEXT" }] },
    { base: "CUSTOMER", name: "Privat" },
    { base: "BOOKING", name: "Charter" },
    { base: "BOOKING", name: "Rundtur" },
  ],
};

/** The fleet (`docs/demo-seed.md`, Katalog). Skippers, tours and add-ons are slice 3. */
export const vingaledenBoats: readonly DemoItem[] = [
  {
    type: "Båt",
    name: "M/S Kajan",
    fields: { "Toalett ombord": true },
    ...{ priceKr: 3200, priceUnit: "PER_HOUR" },
    setups: { Sittande: 48, Stående: 80, "Mingel på däck": 60 },
  },
  {
    type: "Båt",
    name: "M/S Tärnan",
    fields: { "Toalett ombord": true },
    ...{ priceKr: 2100, priceUnit: "PER_HOUR" },
    setups: { Sittande: 24, Stående: 40 },
  },
  {
    type: "Båt",
    name: "RIB Snabben",
    fields: { "Toalett ombord": false, "Max knop": 40 },
    ...{ priceKr: 2600, priceUnit: "PER_HOUR" },
    setups: { Sittande: 12 },
  },
];
