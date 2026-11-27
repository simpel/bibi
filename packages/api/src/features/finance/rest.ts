import { restRoute } from "../../rest-route";

export const financeRoutes = [
  restRoute({ operation: "finance.overview", method: "GET", path: "/finance/overview" }),
  // The connected ledger's mappings, one list (ADR 0123), so no id in the path.
  restRoute({ operation: "accountMapping.list", method: "GET", path: "/account-mappings" }),
  restRoute({ operation: "accountMapping.set", method: "PUT", path: "/account-mappings" }),
];
