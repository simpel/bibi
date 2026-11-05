import { densityOrders } from "../../density-orders";
import type { DemoOrg } from "../../types";
import { usedAssetDays } from "../../used-asset-days";
import { saltholmenHours } from "../demo-hours";
import { vingaledenBoats, vingaledenConfig } from "./config";
import { vingaledenCustomers } from "./customers";
import { vingaledenDensity } from "./density";
import { vingaledenPipeline } from "./pipeline";
import { vingaledenResponsibilities } from "./responsibilities";
import { vingaledenTemplates } from "./templates";
import { vingaledenOrders } from "./orders";
import { vingaledenTours } from "./tours";
import { vingaledenRunSheets } from "./run-sheets";

const items = [...vingaledenBoats, ...vingaledenTours];
const reserved = usedAssetDays({
  orders: vingaledenOrders,
  templates: vingaledenTemplates,
  items,
});

/**
 * Vingaleden Archipelago Tours (`docs/demo-seed.md`): fixed roles (ADR 0034). Stina books,
 * the skippers only read.
 */
export const vingaleden: DemoOrg = {
  slug: "vingaleden-demo",
  name: "Vingaleden Archipelago Tours",
  timeZone: "Europe/Stockholm",
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
      // The venue override (ADR 0064): same offset as the organization, so times read the same.
      timeZone: "Europe/Oslo",
    },
    venueHours: saltholmenHours,
    items,
    // Check 2: no allergen list at all. Its run sheets (slice 6) will not include food either.
    checks: { absentLists: ["Allergens"] },
  },
  responsibilities: vingaledenResponsibilities,
  runSheets: vingaledenRunSheets,
  customers: vingaledenCustomers,
  pipeline: vingaledenPipeline,
  templates: vingaledenTemplates,
  orders: [...vingaledenOrders, ...densityOrders({ density: vingaledenDensity, reserved })],
  density: vingaledenDensity,
};
