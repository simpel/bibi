import type { DemoOrg } from "../../types";
import { vingaledenBoats, vingaledenConfig } from "./config";
import { vingaledenCustomers } from "./customers";
import { vingaledenPipeline } from "./pipeline";
import { vingaledenResponsibilities } from "./responsibilities";
import { vingaledenTemplates } from "./templates";
import { vingaledenTickets } from "./tickets";
import { vingaledenTours } from "./tours";

/**
 * Vingaleden Archipelago Tours (`docs/demo-seed.md`): fixed roles (ADR 0034). Stina books,
 * the skippers only read.
 */
export const vingaleden: DemoOrg = {
  slug: "vingaleden-demo",
  name: "Vingaleden Archipelago Tours",
  users: [
    { name: "Per Vinga", role: "admin" },
    { name: "Stina Holm", role: "manager" },
    { name: "Kalle Ek", role: "member" },
    { name: "Jonna Sand", role: "member" },
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
  responsibilities: vingaledenResponsibilities,
  customers: vingaledenCustomers,
  pipeline: vingaledenPipeline,
  templates: vingaledenTemplates,
  tickets: vingaledenTickets,
};
