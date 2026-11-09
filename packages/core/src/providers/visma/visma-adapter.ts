import { sweepProviderInvoices } from "../sweep-invoices";
import type { ProviderAdapter } from "../types";
import { VISMA_POLL_INTERVAL_MS, vismaClient } from "./visma-config";
import { vismaInvoicing } from "./visma-invoicing";
import { vismaOauth } from "./visma-oauth";

/**
 * Visma eEkonomi (ADR 0100): OAuth connect, invoices raised and booked there (a ledger provider)
 * and payments read by a scheduled poll, since Visma pushes nothing for them.
 */
export const vismaAdapter: ProviderAdapter = {
  key: "VISMA",
  ledger: true,
  isConfigured: () => vismaClient() !== null,
  connect: vismaOauth,
  invoicing: vismaInvoicing,
  signals: {
    poll: {
      intervalMs: VISMA_POLL_INTERVAL_MS,
      // `invoice.sync` on every SENT Visma invoice reads what Visma received (derived payments).
      run: ({ db }) => sweepProviderInvoices({ provider: "VISMA", ...(db ? { db } : {}) }),
    },
  },
};
