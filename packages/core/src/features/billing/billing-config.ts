import { type Db, getDb } from "@bibi/db";
import { openSecret } from "../../crypto/secret-box";
import { err, ok, type Result } from "../../errors/result";

/** The one `BillingConfig` row (ADR 0095). */
export const BILLING_CONFIG_ID = "default";

export type BillingPrices = { baseMonthly: string; baseYearly: string; seat: string };

/** Bibi's own Stripe Billing keys, opened for one call. Never logged or returned. */
export type BillingKeys = {
  secretKey: string;
  prices: BillingPrices;
  portalConfigId: string | null;
};

type LoadInput = { db?: Db };

/** The row as stored, or null before a superadmin saved anything. */
export function loadBillingConfigRow({ db = getDb() }: LoadInput = {}) {
  return db.billingConfig.findUnique({ where: { id: BILLING_CONFIG_ID } });
}

/** The key and prices, or null while billing is not fully configured (nothing is gated then). */
export async function loadBillingKeys({ db }: LoadInput = {}): Promise<Result<BillingKeys | null>> {
  const row = await loadBillingConfigRow({ ...(db ? { db } : {}) });
  const { basePriceMonthlyId, basePriceYearlyId, seatPriceId } = row ?? {};
  if (!row?.secretKeySealed || !basePriceMonthlyId || !basePriceYearlyId || !seatPriceId) {
    return ok({ value: null });
  }
  const secretKey = openSecret({ sealed: row.secretKeySealed });
  if (!secretKey.ok) return err({ error: secretKey.error });
  return ok({
    value: {
      secretKey: secretKey.value,
      prices: { baseMonthly: basePriceMonthlyId, baseYearly: basePriceYearlyId, seat: seatPriceId },
      portalConfigId: row.portalConfigId,
    },
  });
}

/** The webhook signing secret, or null when none is stored. */
export async function loadBillingWebhookSecret({
  db,
}: LoadInput = {}): Promise<Result<string | null>> {
  const row = await loadBillingConfigRow({ ...(db ? { db } : {}) });
  if (!row?.webhookSecretSealed) return ok({ value: null });
  return openSecret({ sealed: row.webhookSecretSealed });
}
