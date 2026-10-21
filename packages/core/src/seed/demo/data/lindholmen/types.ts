import type { DemoType } from "../../config-types";

const languages = ["Swedish", "English", "German"];
const orgnr = { name: "Org no.", kind: "TEXT" } as const;

/** Lindholmen's own types (`docs/demo-seed.md`: item types and other types). */
export const lindholmenTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Conference room",
    states: "bookable",
    capabilities: ["BOOKABLE", "SETUPS", "PRICED"],
    // ADR 0059: a room's setup is at least this, or its setup's changeover when that is longer.
    ...{ setupMinutes: 15, teardownMinutes: 15 },
    fields: [
      { name: "Floor", kind: "NUMBER" },
      { name: "Area m²", kind: "NUMBER" },
      { name: "Ceiling height m", kind: "NUMBER" },
      { name: "Daylight", kind: "BOOLEAN" },
      { name: "View", kind: "CHOICE", list: "View" },
    ],
  },
  {
    base: "ITEM",
    name: "Dish",
    states: "food",
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Diet", kind: "MULTI_CHOICE", list: "Diet" },
    ],
  },
  {
    base: "ITEM",
    name: "Drink",
    states: "food",
    capabilities: ["PRICED"],
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Alcoholic", kind: "BOOLEAN" },
    ],
  },
  {
    base: "ITEM",
    name: "Meal",
    states: "food",
    capabilities: ["PRICED", "BUNDLE", "CUSTOMISATIONS"],
    ...{ setupMinutes: 30, teardownMinutes: 15 },
    fields: [
      { name: "Service style", kind: "CHOICE", options: ["Buffet", "Plated", "Finger food"] },
    ],
  },
  {
    base: "ITEM",
    name: "Tour",
    states: "other",
    capabilities: ["PRICED", "BUNDLE", "CUSTOMISATIONS", "BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Guide",
    states: "other",
    capabilities: ["BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Equipment",
    states: "bookable",
    capabilities: ["BOOKABLE", "PRICED"],
    ...{ setupMinutes: 10, teardownMinutes: 10 },
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Wireless microphone",
    states: "bookable",
    capabilities: ["BOOKABLE"],
    ...{ setupMinutes: 5, teardownMinutes: 5, pool: true },
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Bundle",
    capabilities: ["PRICED", "BUNDLE", "CUSTOMISATIONS"],
    fields: [{ name: "Minimum quantity", kind: "NUMBER" }],
  },
  { base: "LINE", name: "Line" },
  {
    base: "CUSTOMER",
    name: "Company",
    fields: [orgnr, { name: "Framework agreement", kind: "BOOLEAN" }],
  },
  {
    base: "CUSTOMER",
    name: "Public sector",
    fields: [
      orgnr,
      { name: "Peppol-ID", kind: "TEXT" },
      { name: "Requires case number", kind: "BOOLEAN" },
    ],
  },
  { base: "CUSTOMER", name: "Association", fields: [orgnr] },
  {
    base: "CONTACT",
    name: "Contact person",
    fields: [
      { name: "Role", kind: "CHOICE", options: ["Orderer", "Invoice recipient", "Organizer"] },
    ],
  },
  {
    base: "TICKET",
    name: "Conference",
    fields: [
      { name: "Purpose", kind: "TEXT" },
      { name: "Host", kind: "LINK", linkType: "Contact person" },
    ],
  },
  {
    base: "TICKET",
    name: "Event",
    fields: [
      { name: "Dresscode", kind: "CHOICE", list: "Dresscode" },
      { name: "Speaker/entertainment", kind: "TEXT" },
    ],
  },
  { base: "TICKET", name: "Tour", fields: [{ name: "School class", kind: "BOOLEAN" }] },
];
