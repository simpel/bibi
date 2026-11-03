import { billingMcpTools } from "../features/billing/mcp";
import { depositMcpTools } from "../features/deposit/mcp";
import { integrationMcpTools } from "../features/integration/mcp";
import { invoiceMcpTools } from "../features/invoice/mcp";
import { paymentMcpTools } from "../features/payment/mcp";
import { paymentAccountMcpTools } from "../features/payment-account/mcp";

/**
 * Payments, the receivables they settle (ADR 0057), the payout account and Bibi's own
 * subscription (ADR 0095), kept apart so `meta-registry.ts` fits.
 */
export const moneyMcpTools = [
  ...integrationMcpTools,
  ...paymentAccountMcpTools,
  ...billingMcpTools,
  ...paymentMcpTools,
  ...depositMcpTools,
  ...invoiceMcpTools,
];
