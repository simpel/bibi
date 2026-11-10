import type { ProviderAdapter } from "../types";
import { swishCollect } from "./swish-collect";
import { swishConfigured } from "./swish-config";
import { swishConnect } from "./swish-connect";
import { swishWebhook } from "./swish-webhook";

/**
 * Swish Handel (ADR 0100): the venue's certificate entered in Bibi, payment requests started at
 * the pay page, refunds, and unsigned callbacks that Bibi reads again from Swish before applying.
 * Swish keeps no books.
 */
export const swishAdapter: ProviderAdapter = {
  key: "SWISH",
  ledger: false,
  isConfigured: swishConfigured,
  connect: swishConnect,
  collect: swishCollect,
  signals: { webhook: swishWebhook },
};
