import type { DemoType } from "../../config-types";

const languages = ["Swedish", "English", "German"];
const orgnr = { name: "Org no.", kind: "TEXT" } as const;

/** Lindholmen's own types (`docs/demo-seed.md`: item types and other types). */
export const lindholmenTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Conference room",
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
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Diet", kind: "MULTI_CHOICE", list: "Diet" },
    ],
  },
  {
    base: "ITEM",
    name: "Drink",
    behaviours: ["PRICED"],
    fields: [
      { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" },
      { name: "Alcoholic", kind: "BOOLEAN" },
    ],
  },
  {
    base: "ITEM",
    name: "Meal",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [
      { name: "Service style", kind: "CHOICE", options: ["Buffet", "Plated", "Finger food"] },
    ],
  },
  {
    base: "ITEM",
    name: "Tour",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES", "BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Guide",
    behaviours: ["BOOKABLE"],
    fields: [{ name: "Language", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Equipment",
    behaviours: ["BOOKABLE", "PRICED"],
    fields: [{ name: "Inventory number", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Package",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [{ name: "Minimum quantity", kind: "NUMBER" }],
  },
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
  { base: "BOOKING", name: "Conference", fields: [{ name: "Purpose", kind: "TEXT" }] },
  {
    base: "BOOKING",
    name: "Event",
    fields: [
      { name: "Dresscode", kind: "CHOICE", list: "Dresscode" },
      { name: "Speaker/entertainment", kind: "TEXT" },
    ],
  },
  { base: "BOOKING", name: "Tour", fields: [{ name: "School class", kind: "BOOLEAN" }] },
];
