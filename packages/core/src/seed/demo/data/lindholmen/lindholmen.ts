import type { DemoOrg } from "../../types";
import { lindholmenActivities } from "./activities";
import { lindholmenAlternativeTickets } from "./alternative-tickets";
import { lindholmenBundles } from "./bundles";
import { lindholmenLists } from "./config";
import { lindholmenCustomers } from "./customers";
import { lindholmenDishes } from "./dishes";
import { lindholmenDrinks } from "./drinks";
import { lindholmenMeals } from "./meals";
import { lindholmenPipeline } from "./pipeline";
import { lindholmenResponsibilities } from "./responsibilities";
import { lindholmenRooms } from "./rooms";
import { lindholmenTemplates } from "./templates";
import { lindholmenTickets } from "./tickets";
import { lindholmenTypes } from "./types";

/**
 * Lindholmen Experience Center (`docs/demo-seed.md`): fixed roles (ADR 0034). Johan configures,
 * the caretaker only reads; what each person answers for comes with responsibilities.
 */
export const lindholmen: DemoOrg = {
  slug: "lindholmen-demo",
  name: "Lindholmen Experience Center",
  users: [
    { name: "Anna Berg", role: "admin" },
    { name: "Erik Lund", role: "manager" },
    { name: "Sara Nilsson", role: "manager" },
    { name: "Johan Ek", role: "admin" },
    // Handles bookings but not money (ADR 0050).
    {
      name: "Maria Holm",
      role: "manager",
      overrides: [{ feature: "payment", action: "read", effect: "deny" }],
    },
    { name: "Ali Karimi", role: "manager" },
    // Reads everything and also keeps the catalogue up to date.
    {
      name: "Peter Sjoberg",
      role: "member",
      overrides: [{ feature: "item", action: "write", effect: "allow" }],
    },
    { name: "Lena Strand", role: "manager" },
  ],
  config: {
    ...lindholmenLists,
    types: lindholmenTypes,
    venue: {
      name: "Lindholmen Experience Center",
      streetAddress: "Lindholmspiren 1",
      postalCode: "417 56",
      city: "Göteborg",
    },
    // Parts come after the items they contain.
    items: [
      ...lindholmenRooms,
      ...lindholmenDishes,
      ...lindholmenDrinks,
      ...lindholmenMeals,
      ...lindholmenActivities,
      ...lindholmenBundles,
    ],
    checks: { listSizes: { Allergens: 14 } },
  },
  responsibilities: lindholmenResponsibilities,
  customers: lindholmenCustomers,
  pipeline: lindholmenPipeline,
  templates: lindholmenTemplates,
  tickets: [...lindholmenTickets, ...lindholmenAlternativeTickets],
};
