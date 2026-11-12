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
];
