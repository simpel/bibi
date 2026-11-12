import type { WebSurface } from "./web-surfaces";

/** The Financials dashboard and its accounting settings (ADR 0077, 0086), part of `WEB_SURFACES`. */
export const FINANCE_SURFACES: readonly WebSurface[] = [
  { operation: "finance.overview", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingSettings.get", route: "/admin/accounting" },
  { operation: "accountingSettings.update", route: "/admin/accounting" },
];
