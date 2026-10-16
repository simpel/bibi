import type { DemoOrg } from "../../types";
import { lindholmenActivities } from "./activities";
import { lindholmenBookings } from "./bookings";
import { lindholmenLists } from "./config";
import { lindholmenCustomers } from "./customers";
import { lindholmenDishes } from "./dishes";
import { lindholmenDrinks } from "./drinks";
import { lindholmenMeals } from "./meals";
import { lindholmenPackages } from "./packages";
import { lindholmenRooms } from "./rooms";
import { lindholmenTypes } from "./types";

/**
 * Lindholmen Experience Center (`docs/demo-seed.md`): the "Conference venue" template plus its own
 * role Caretaker. Caretaker gets setup sheets in slice 6; for now it reads the catalog.
 */
export const lindholmen: DemoOrg = {
  slug: "lindholmen-demo",
  name: "Lindholmen Experience Center",
  templates: ["conference-venue"],
  roles: [
    {
      name: "Caretaker",
      permissions: {
        search: ["read"],
        conversation: ["write"],
        skill: ["write"],
        venue: ["read"],
        item: ["read"],
        configuration: ["read"],
      },
    },
  ],
  users: [
    { name: "Anna Berg", role: "owner" },
    { name: "Erik Lund", role: "Sales" },
    { name: "Sara Nilsson", role: "Sales" },
    { name: "Johan Ek", role: "Coordinator" },
    { name: "Maria Holm", role: "Coordinator" },
    { name: "Ali Karimi", role: "Kitchen" },
    { name: "Peter Sjoberg", role: "Caretaker" },
    { name: "Lena Strand", role: "Finance" },
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
  customers: lindholmenCustomers,
  bookings: lindholmenBookings,
};
