import type { DemoOrg } from "../../types";
import { lindholmenHours } from "../demo-hours";
import { lindholmenActivities } from "./activities";
import { lindholmenAlternativeTickets } from "./alternative-tickets";
import { lindholmenBundleTickets } from "./bundle-tickets";
import { conferenceDayBundle, lindholmenBundles } from "./bundles";
import { lindholmenLists } from "./config";
import { lindholmenCustomers } from "./customers";
import { lindholmenDishes } from "./dishes";
import { lindholmenDrinks } from "./drinks";
import { lindholmenMeals } from "./meals";
import { lindholmenPipeline } from "./pipeline";
import { lindholmenResponsibilities } from "./responsibilities";
import { lindholmenRooms } from "./rooms";
import { lindholmenStaff, lindholmenStaffTypes } from "./staff";
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
  timeZone: "Europe/Stockholm",
  users: [
    { name: "Anna Berg", role: "admin" },
    // Reads dates as 2026-08-27 and a 12 hour clock (ADR 0046).
    {
      name: "Erik Lund",
      role: "manager",
      displayFormats: { dateFormat: "YYYY_MM_DD", clockFormat: "H12" },
    },
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
    types: [...lindholmenTypes, ...lindholmenStaffTypes],
    venue: {
      name: "Lindholmen Experience Center",
      streetAddress: "Lindholmspiren 1",
      postalCode: "417 56",
      city: "Göteborg",
    },
    venueHours: lindholmenHours,
    // Parts come after the items they contain.
    items: [
      ...lindholmenRooms,
      ...lindholmenDishes,
      ...lindholmenDrinks,
      ...lindholmenMeals,
      ...lindholmenActivities,
      ...lindholmenBundles,
      conferenceDayBundle,
    ],
    checks: { listSizes: { Allergens: 14 } },
  },
  responsibilities: lindholmenResponsibilities,
  staff: lindholmenStaff,
  customers: lindholmenCustomers,
  pipeline: lindholmenPipeline,
  templates: lindholmenTemplates,
  tickets: [...lindholmenTickets, ...lindholmenAlternativeTickets, ...lindholmenBundleTickets],
};
