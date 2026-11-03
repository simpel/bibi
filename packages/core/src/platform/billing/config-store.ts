import { sealSecret } from "../../crypto/secret-box";
import { err, ok, type Result } from "../../errors/result";
import { BILLING_CONFIG_ID } from "../../features/billing/billing-config";
import type { PlatformDb } from "../types";
import type { BillingConfigDto, BillingConfigUpdateInput } from "./schema";

type Row = Awaited<ReturnType<PlatformDb["billingConfig"]["findUnique"]>>;

/** The superadmin's view of the row; the sealed secrets become flags and a key hint. */
export function toBillingConfigDto({ row }: { row: Row }): BillingConfigDto {
  return {
    configured: Boolean(
      row?.secretKeySealed && row.basePriceMonthlyId && row.basePriceYearlyId && row.seatPriceId,
    ),
    secretKeyHint: row?.secretKeyHint ?? null,
    livemode: row?.livemode ?? false,
    hasWebhookSecret: Boolean(row?.webhookSecretSealed),
    webhookEndpointId: row?.webhookEndpointId ?? null,
    productId: row?.productId ?? null,
    basePriceMonthlyId: row?.basePriceMonthlyId ?? null,
    basePriceYearlyId: row?.basePriceYearlyId ?? null,
    seatPriceId: row?.seatPriceId ?? null,
    portalConfigId: row?.portalConfigId ?? null,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

export const loadConfigRow = ({ db }: { db: PlatformDb }) =>
  db.billingConfig.findUnique({ where: { id: BILLING_CONFIG_ID } });

export type ConfigData = Partial<NonNullable<Row>>;

/**
 * What a key's account holds: another key may be another account or mode, so these are cleared
 * and billing stays unconfigured until it is provisioned again (prices given with the key stay).
 */
const STRIPE_OBJECTS_CLEARED = {
  productId: null,
  basePriceMonthlyId: null,
  basePriceYearlyId: null,
  seatPriceId: null,
  portalConfigId: null,
  webhookEndpointId: null,
  webhookSecretSealed: null,
};

/** Seals the secrets of an update; a new key also clears what the old one created. */
export function sealUpdate({ input }: { input: BillingConfigUpdateInput }): Result<ConfigData> {
  const { secretKey, webhookSecret, ...given } = input;
  // Only the prices given: an omitted one must not undo the clearing below.
  const prices = Object.fromEntries(Object.entries(given).filter(([, value]) => value));
  const data: ConfigData = { ...prices };
  if (secretKey) {
    const sealed = sealSecret({ plain: secretKey });
    if (!sealed.ok) return err({ error: sealed.error });
    Object.assign(data, {
      ...STRIPE_OBJECTS_CLEARED,
      ...prices,
      secretKeySealed: sealed.value,
      secretKeyHint: secretKey.slice(-4),
      livemode: secretKey.includes("_live_"),
    });
  }
  if (webhookSecret) {
    const sealed = sealSecret({ plain: webhookSecret });
    if (!sealed.ok) return err({ error: sealed.error });
    data.webhookSecretSealed = sealed.value;
  }
  return ok({ value: data });
}

export type SaveConfigInput = { db: PlatformDb; data: ConfigData; updatedBy: string };

/** Writes the row and returns before and after for the audit trail (secrets redacted). */
export async function saveConfig({ db, data, updatedBy }: SaveConfigInput) {
  const before = await loadConfigRow({ db });
  const after = await db.billingConfig.upsert({
    where: { id: BILLING_CONFIG_ID },
    create: { id: BILLING_CONFIG_ID, ...data, updatedBy },
    update: { ...data, updatedBy },
  });
  return {
    before: before ? toBillingConfigDto({ row: before }) : null,
    after: toBillingConfigDto({ row: after }),
  };
}
