import type { WebSurface } from "./web-surfaces";

/** The Financials dashboard and its accounting settings (ADR 0077, 0086), part of `WEB_SURFACES`. */
export const FINANCE_SURFACES: readonly WebSurface[] = [
  { operation: "finance.overview", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingSettings.get", route: "/settings/accounting" },
  { operation: "accountingSettings.update", route: "/settings/accounting" },
  { operation: "accountingExport.preview", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingExport.create", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingExport.list", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingExport.get", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountingExport.download", route: "/data/[dashboard]/[from]/[to]" },
];
