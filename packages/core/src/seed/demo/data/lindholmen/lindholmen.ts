import type { DemoOrg } from "../../types";
import { lindholmenActivities } from "./activities";
import { lindholmenLists } from "./config";
import { lindholmenCustomers } from "./customers";
import { lindholmenDishes } from "./dishes";
import { lindholmenDrinks } from "./drinks";
import { lindholmenMeals } from "./meals";
import { lindholmenPackages } from "./packages";
import { lindholmenPipeline } from "./pipeline";
import { lindholmenResponsibilities } from "./responsibilities";
import { lindholmenRooms } from "./rooms";
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
    { name: "Anna Berg", role: "owner" },
    { name: "Erik Lund", role: "member" },
    { name: "Sara Nilsson", role: "member" },
    { name: "Johan Ek", role: "admin" },
    { name: "Maria Holm", role: "member" },
    { name: "Ali Karimi", role: "member" },
    { name: "Peter Sjoberg", role: "viewer" },
    { name: "Lena Strand", role: "member" },
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
      ...lindholmenPackages,
    ],
    checks: { listSizes: { Allergens: 14 } },
  },
  responsibilities: lindholmenResponsibilities,
  customers: lindholmenCustomers,
  pipeline: lindholmenPipeline,
  tickets: lindholmenTickets,
};
