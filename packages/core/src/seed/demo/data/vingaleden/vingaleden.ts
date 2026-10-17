import type { DemoOrg } from "../../types";
import { vingaledenBookings } from "./bookings";
import { vingaledenBoats, vingaledenConfig } from "./config";
import { vingaledenCustomers } from "./customers";
import { vingaledenTours } from "./tours";

/**
 * Vingaleden Archipelago Tours (`docs/demo-seed.md`): fixed roles (ADR 0034). Stina books,
 * the skippers only read.
 */
export const vingaleden: DemoOrg = {
  slug: "vingaleden-demo",
  name: "Vingaleden Archipelago Tours",
  users: [
    { name: "Per Vinga", role: "owner" },
    { name: "Stina Holm", role: "member" },
    { name: "Kalle Ek", role: "viewer" },
    { name: "Jonna Sand", role: "viewer" },
  ],
  config: {
    ...vingaledenConfig,
    venue: {
      name: "Saltholmen",
      streetAddress: "Saltholmen",
      postalCode: "426 76",
      city: "Västra Frölunda",
    },
    items: [...vingaledenBoats, ...vingaledenTours],
    // Check 2: no allergen list at all. Its sheets (slice 6) will not include food either.
    checks: { absentLists: ["Allergens"] },
  },
  customers: vingaledenCustomers,
  bookings: vingaledenBookings,
};
