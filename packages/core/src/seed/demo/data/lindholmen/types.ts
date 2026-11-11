import type { DemoType } from "../../config-types";

const languages = ["Swedish", "English", "German"];
const orgnr = { name: "Org no.", kind: "TEXT" } as const;

/** Lindholmen's own types (`docs/demo-seed.md`: item types and other types). */
export const lindholmenTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Conference room",
    pluralName: "Conference rooms",
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
    pluralName: "Dishes",
    states: "food",
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Diet", kind: "MULTI_CHOICE", list: "Diet" },
    ],
  },
  {
    base: "ITEM",
    name: "Drink",
    pluralName: "Drinks",
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
    pluralName: "Meals",
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
    pluralName: "Tours",
    states: "other",
    capabilities: ["PRICED", "BUNDLE", "CUSTOMISATIONS", "BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Guide",
    pluralName: "Guides",
    states: "other",
    capabilities: ["BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Equipment",
    pluralName: "Equipment",
    states: "bookable",
    // ADR 0059: customisations on any item, e.g. who installs it.
    capabilities: ["BOOKABLE", "PRICED", "CUSTOMISATIONS"],
    ...{ setupMinutes: 10, teardownMinutes: 10 },
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Service",
    pluralName: "Services",
    states: "other",
    capabilities: ["PRICED"],
  },
  {
    base: "ITEM",
    name: "Wireless microphone",
    pluralName: "Wireless microphones",
    states: "bookable",
    capabilities: ["BOOKABLE"],
    ...{ setupMinutes: 5, teardownMinutes: 5, pool: true },
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    // ADR 0059: staff are bookable items of a Person type, allocated to lines by demands.
    base: "ITEM",
    name: "Technician",
    pluralName: "Technicians",
    states: "bookable",
    capabilities: ["BOOKABLE"],
    ...{ resourceKind: "PERSON", pool: true },
  },
  {
    base: "ITEM",
    name: "Bundle",
    pluralName: "Bundles",
    capabilities: ["PRICED", "BUNDLE", "CUSTOMISATIONS"],
    fields: [{ name: "Minimum quantity", kind: "NUMBER" }],
  },
  { base: "LINE", name: "Line", pluralName: "Lines" },
  {
    base: "CUSTOMER",
    name: "Company",
    pluralName: "Companies",
    fields: [orgnr, { name: "Framework agreement", kind: "BOOLEAN" }],
  },
  {
    base: "CUSTOMER",
    name: "Public sector",
    pluralName: "Public sector",
    fields: [
      orgnr,
      { name: "Peppol-ID", kind: "TEXT" },
      { name: "Requires case number", kind: "BOOLEAN" },
    ],
  },
  { base: "CUSTOMER", name: "Association", pluralName: "Associations", fields: [orgnr] },
  {
    base: "CONTACT",
    name: "Contact person",
    pluralName: "Contact people",
    fields: [
      { name: "Role", kind: "CHOICE", options: ["Orderer", "Invoice recipient", "Organizer"] },
    ],
  },
  {
    base: "ORDER",
    name: "Conference",
    pluralName: "Conferences",
    fields: [
      { name: "Purpose", kind: "TEXT" },
      { name: "Host", kind: "LINK", linkType: "Contact person" },
    ],
  },
  {
    base: "ORDER",
    name: "Event",
    pluralName: "Events",
    fields: [
      { name: "Dresscode", kind: "CHOICE", list: "Dresscode" },
      { name: "Speaker/entertainment", kind: "TEXT" },
    ],
  },
  {
    base: "ORDER",
    name: "Tour",
    pluralName: "Tours",
    fields: [{ name: "School class", kind: "BOOLEAN" }],
  },
];
