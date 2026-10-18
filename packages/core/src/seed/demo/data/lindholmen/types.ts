import type { DemoType } from "../../config-types";

const languages = ["Swedish", "English", "German"];
const orgnr = { name: "Org no.", kind: "TEXT" } as const;

/** Lindholmen's own types (`docs/demo-seed.md`: item types and other types). */
export const lindholmenTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Conference room",
    states: "bookable",
    behaviours: ["BOOKABLE", "SETUPS", "PRICED"],
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
    behaviours: ["PRICED"],
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Alcoholic", kind: "BOOLEAN" },
    ],
  },
  {
    base: "ITEM",
    name: "Meal",
    states: "food",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [
      { name: "Service style", kind: "CHOICE", options: ["Buffet", "Plated", "Finger food"] },
    ],
  },
  {
    base: "ITEM",
    name: "Tour",
    states: "other",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES", "BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Guide",
    states: "other",
    behaviours: ["BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Equipment",
    states: "bookable",
    behaviours: ["BOOKABLE", "PRICED"],
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Package",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [{ name: "Minimum quantity", kind: "NUMBER" }],
  },
  { base: "PROGRAM_ITEM", name: "Line" },
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
  { base: "TICKET", name: "Conference", fields: [{ name: "Purpose", kind: "TEXT" }] },
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
