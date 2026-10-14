import type { PermissionSet } from "../../../../permissions/permission-set";
import type { DemoOrg } from "../../types";
import { vingaledenBoats, vingaledenConfig } from "./config";
import { vingaledenTours } from "./tours";

const base: PermissionSet = { search: ["read"], conversation: ["write"], skill: ["write"] };

/**
 * Vingaleden Archipelago Tours (`docs/demo-seed.md`): no templates, three roles of its own.
 * Booking writes customers, inquiries and bookings and Skipper reads bookings and sheets once
 * those resources exist (slices 4–6); until then both read the fleet (venues, items and configuration).
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
      permissions: { ...base, venue: ["read"], item: ["read"], configuration: ["read"] },
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
};
