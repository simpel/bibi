import type { ProviderAdapter } from "../types";
import { fortnoxCredentials } from "./fortnox-config";
import { fortnoxInvoicing } from "./fortnox-invoicing";
import { fortnoxOauth } from "./fortnox-oauth";
import { FORTNOX_REPLAY_MS } from "./stream/replay";

/**
 * Fortnox (ADR 0087, 0090, 0100): OAuth connect, invoices raised and booked there (a ledger
 * provider: it keeps the books for what it invoices) and payments pushed over the Topics stream.
 */
export const fortnoxAdapter: ProviderAdapter = {
  key: "FORTNOX",
  ledger: true,
  isConfigured: () => fortnoxCredentials() !== null,
  connect: fortnoxOauth,
  invoicing: fortnoxInvoicing,
  signals: {
    stream: { isConfigured: () => fortnoxCredentials() !== null, replayMs: FORTNOX_REPLAY_MS },
  },
};
