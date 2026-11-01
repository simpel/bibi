import type { WebSurface } from "./web-surfaces";

/** The Financials tab of the dashboard and its accounting settings (ADR 0077, 0086), part of `WEB_SURFACES`. */
export const FINANCE_SURFACES: readonly WebSurface[] = [
  { operation: "finance.overview", route: "/dashboard/[tab]/[from]/[to]" },
  { operation: "accountingSettings.get", route: "/settings/accounting" },
  { operation: "accountingSettings.update", route: "/settings/accounting" },
  { operation: "accountingExport.preview", route: "/dashboard/[tab]/[from]/[to]" },
  { operation: "accountingExport.create", route: "/dashboard/[tab]/[from]/[to]" },
  { operation: "accountingExport.list", route: "/dashboard/[tab]/[from]/[to]" },
  { operation: "accountingExport.get", route: "/dashboard/[tab]/[from]/[to]" },
  { operation: "accountingExport.download", route: "/dashboard/[tab]/[from]/[to]" },
];
