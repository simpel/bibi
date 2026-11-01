import type { WebSurface } from "./web-surfaces";

/** The financials page and its accounting settings (ADR 0077), part of `WEB_SURFACES`. */
export const FINANCE_SURFACES: readonly WebSurface[] = [
  { operation: "finance.overview", route: "/financials/[from]/[to]" },
  { operation: "accountingSettings.get", route: "/settings/accounting" },
  { operation: "accountingSettings.update", route: "/settings/accounting" },
  { operation: "accountingExport.preview", route: "/financials/[from]/[to]" },
  { operation: "accountingExport.create", route: "/financials/[from]/[to]" },
  { operation: "accountingExport.list", route: "/financials/[from]/[to]" },
  { operation: "accountingExport.get", route: "/financials/[from]/[to]" },
  { operation: "accountingExport.download", route: "/financials/[from]/[to]" },
];
