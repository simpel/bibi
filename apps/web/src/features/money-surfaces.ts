import type { WebSurface } from "./web-surfaces";

/**
 * Payments and the receivables they settle (ADR 0057), part of `WEB_SURFACES`: all on the
 * ticket page's money section, except the deposit request's create page.
 */
export const MONEY_SURFACES: readonly WebSurface[] = [
  { operation: "payment.list", route: "/tickets/[id]" },
  { operation: "payment.create", route: "/tickets/[id]" },
  { operation: "payment.balance", route: "/tickets/[id]" },
  { operation: "deposit.list", route: "/tickets/[id]" },
  { operation: "deposit.create", route: "/new/deposit" },
  { operation: "deposit.send", route: "/tickets/[id]" },
  { operation: "deposit.void", route: "/tickets/[id]" },
  { operation: "invoice.list", route: "/tickets/[id]" },
  { operation: "invoice.create", route: "/tickets/[id]" },
  { operation: "invoice.send", route: "/tickets/[id]" },
  { operation: "invoice.void", route: "/tickets/[id]" },
];
