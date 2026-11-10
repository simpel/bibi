import { FINANCE_SURFACES } from "./finance-surfaces";
import type { WebSurface } from "./web-surfaces";

/**
 * Payments and the receivables they settle (ADR 0057), part of `WEB_SURFACES`: all on the
 * order page's money section, except the deposit request's create page.
 */
export const MONEY_SURFACES: readonly WebSurface[] = [
  { operation: "payment.list", route: "/orders/[id]" },
  { operation: "payment.create", route: "/orders/[id]" },
  { operation: "payment.refund", route: "/orders/[id]" },
  { operation: "payment.cancel", route: "/orders/[id]" },
  { operation: "payment.recordManual", route: "/orders/[id]" },
  { operation: "payment.balance", route: "/orders/[id]" },
  { operation: "deposit.list", route: "/orders/[id]" },
  { operation: "deposit.create", route: "/new/deposit" },
  { operation: "deposit.suggest", route: "/orders/[id]" },
  { operation: "deposit.request", route: "/orders/[id]" },
  { operation: "deposit.send", route: "/orders/[id]" },
  { operation: "deposit.void", route: "/orders/[id]" },
  { operation: "invoice.list", route: "/orders/[id]" },
  { operation: "invoice.create", route: "/orders/[id]" },
  { operation: "invoice.send", route: "/orders/[id]" },
  { operation: "invoice.sync", route: "/orders/[id]" },
  { operation: "invoice.void", route: "/orders/[id]" },
  { operation: "invoice.credit", route: "/orders/[id]" },
  ...FINANCE_SURFACES,
];
