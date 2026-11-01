import { restRoute } from "../../rest-route";

export const financeRoutes = [
  restRoute({ operation: "finance.overview", method: "GET", path: "/finance/overview" }),
  // The organization's one set of accounts (ADR 0077), so no id in the path.
  restRoute({ operation: "accountingSettings.get", method: "GET", path: "/accounting-settings" }),
  restRoute({
    operation: "accountingSettings.update",
    method: "PATCH",
    path: "/accounting-settings",
  }),
  // SIE exports (ADR 0077): preview and create an export of a date range, read and download made ones.
  restRoute({
    operation: "accountingExport.preview",
    method: "GET",
    path: "/accounting-exports/preview",
  }),
  restRoute({ operation: "accountingExport.create", method: "POST", path: "/accounting-exports" }),
  restRoute({ operation: "accountingExport.list", method: "GET", path: "/accounting-exports" }),
  restRoute({ operation: "accountingExport.get", method: "GET", path: "/accounting-exports/{id}" }),
  restRoute({
    operation: "accountingExport.download",
    method: "GET",
    path: "/accounting-exports/{id}/download",
  }),
];
