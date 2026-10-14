import type { PermissionSet } from "../../../permissions/permission-set";
import type { DemoOrg } from "../types";

const base: PermissionSet = { search: ["read"], conversation: ["write"], skill: ["write"] };

/**
 * Vingaleden Skärgårdsturer (`docs/demo-seed.md`): no templates, three roles of its own.
 * Bokning writes customers, inquiries and bookings and Skeppare reads bookings and sheets once
 * those resources exist (slices 4–6); until then both read the fleet (venues and rooms).
 */
export const vingaleden: DemoOrg = {
  slug: "vingaleden-demo",
  name: "Vingaleden Skärgårdsturer",
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
    { name: "Bokning", permissions: { ...base, venue: ["read"], item: ["read"], configuration: ["read"] } },
    { name: "Skeppare", permissions: { ...base, venue: ["read"], item: ["read"], configuration: ["read"] } },
  ],
  users: [
    { name: "Per Vinga", role: "owner" },
    { name: "Stina Holm", role: "Bokning" },
    { name: "Kalle Ek", role: "Skeppare" },
    { name: "Jonna Sand", role: "Skeppare" },
  ],
};
