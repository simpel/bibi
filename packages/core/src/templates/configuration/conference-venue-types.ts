import type { ConfigurationTemplateType } from "./configuration-template";

const orgNumber = { name: "Org no.", kind: "TEXT" } as const;
const allergens = { name: "Allergens", kind: "MULTI_CHOICE", list: "Allergens" } as const;

/** The types of the "Conference venue" starter pack. */
export const conferenceVenueTypes: readonly ConfigurationTemplateType[] = [
  {
    base: "ITEM",
    name: "Conference room",
    behaviours: ["BOOKABLE", "SETUPS", "PRICED"],
    fields: [
      { name: "Floor", kind: "NUMBER" },
      { name: "Area m²", kind: "NUMBER" },
      { name: "Ceiling height m", kind: "NUMBER" },
      { name: "Daylight", kind: "BOOLEAN" },
    ],
  },
  {
    base: "ITEM",
    name: "Dish",
    behaviours: ["PRICED"],
    fields: [allergens, { name: "Diet", kind: "MULTI_CHOICE", list: "Diet" }],
  },
  {
    base: "ITEM",
    name: "Drink",
    behaviours: ["PRICED"],
    fields: [allergens, { name: "Alcoholic", kind: "BOOLEAN" }],
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
  { base: "CUSTOMER", name: "Company", fields: [orgNumber] },
  {
    base: "CUSTOMER",
    name: "Public sector",
    fields: [orgNumber, { name: "Peppol ID", kind: "TEXT" }],
  },
  { base: "BOOKING", name: "Conference", fields: [{ name: "Purpose", kind: "TEXT" }] },
  { base: "PROGRAM_ITEM", name: "Meeting" },
  { base: "PROGRAM_ITEM", name: "Break" },
  { base: "PROGRAM_ITEM", name: "Meal" },
  {
    base: "REQUIREMENT",
    name: "Dietary requirement",
    fields: [{ name: "Severity", kind: "CHOICE", list: "Severity" }],
  },
];
