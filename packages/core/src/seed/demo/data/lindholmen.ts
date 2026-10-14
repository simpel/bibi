import type { DemoOrg } from "../types";

/**
 * Lindholmen Upplevelsecenter (`docs/demo-seed.md`): the "Konferensgård" template plus its own
 * role Vaktmästare. Vaktmästare gets setup sheets in slice 6; for now it reads rooms.
 */
export const lindholmen: DemoOrg = {
  slug: "lindholmen-demo",
  name: "Lindholmen Upplevelsecenter",
  templates: ["conference-venue"],
  roles: [
    {
      name: "Vaktmästare",
      permissions: {
        search: ["read"],
        conversation: ["write"],
        skill: ["write"],
        venue: ["read"],
        room: ["read"],
      },
    },
  ],
  users: [
    { name: "Anna Berg", role: "owner" },
    { name: "Erik Lund", role: "Säljare" },
    { name: "Sara Nilsson", role: "Säljare" },
    { name: "Johan Ek", role: "Koordinator" },
    { name: "Maria Holm", role: "Koordinator" },
    { name: "Ali Karimi", role: "Kök" },
    { name: "Peter Sjö", role: "Vaktmästare" },
    { name: "Lena Ström", role: "Ekonomi" },
  ],
};
