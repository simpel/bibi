import type { WebSurface } from "./web-surfaces";

/** The Financials dashboard and the account mappings shown on the ledger's settings page (ADR 0086, 0123), part of `WEB_SURFACES`. */
export const FINANCE_SURFACES: readonly WebSurface[] = [
  { operation: "finance.overview", route: "/data/[dashboard]/[from]/[to]" },
  { operation: "accountMapping.list", route: "/admin/integrations/[provider]" },
  { operation: "accountMapping.set", route: "/admin/integrations/[provider]" },
];
