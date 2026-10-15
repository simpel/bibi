import type { PermissionSet } from "../../../../permissions/permission-set";
import type { DemoOrg } from "../../types";
import { vingaledenBoats, vingaledenConfig } from "./config";
import { vingaledenCustomers } from "./customers";
import { vingaledenTours } from "./tours";

const base: PermissionSet = { search: ["read"], conversation: ["write"], skill: ["write"] };

/**
 * Vingaleden Archipelago Tours (`docs/demo-seed.md`): no templates, three roles of its own.
 * Both read the fleet (venues, items and configuration). Booking also writes customers and
 * contact persons; inquiries and bookings (Booking) and sheets (Skipper) follow in slices 4–6.
 */
export const vingaleden: DemoOrg = {
  slug: "vingaleden-demo",
  name: "Vingaleden Archipelago Tours",
  templates: [],
  roles: [
    {
      name: "Admin",
      permissions: {
        venue: ["admin"],
        item: ["admin"],
        customer: ["admin"],
        contact: ["admin"],
        configuration: ["admin"],
        search: ["admin"],
        conversation: ["admin"],
        skill: ["admin"],
        role: ["admin"],
        member: ["admin"],
      },
    },
    {
      name: "Booking",
      permissions: {
        ...base,
        ...{ venue: ["read"], item: ["read"], configuration: ["read"] },
        ...{ customer: ["write"], contact: ["write"] },
      },
    },
    {
      name: "Skipper",
      permissions: { ...base, venue: ["read"], item: ["read"], configuration: ["read"] },
    },
  ],
  users: [
    { name: "Per Vinga", role: "owner" },
    { name: "Stina Holm", role: "Booking" },
    { name: "Kalle Ek", role: "Skipper" },
    { name: "Jonna Sand", role: "Skipper" },
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
};
