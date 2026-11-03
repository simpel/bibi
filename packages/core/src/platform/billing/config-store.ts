import { sealSecret } from "../../crypto/secret-box";
import { err, ok, type Result } from "../../errors/result";
import { BILLING_CONFIG_ID } from "../../features/billing/billing-config";
import { BILLING_PLAN } from "../../features/billing/plan";
import type { PlatformDb } from "../types";
import type { BillingConfigDto, BillingConfigUpdateInput, BillingProductDto } from "./schema";

type Row = Awaited<ReturnType<PlatformDb["billingConfig"]["findUnique"]>>;

type ProductInput = Pick<BillingProductDto, "key" | "amountMinor" | "interval"> & {
  id: string | null | undefined;
};

const product = ({ id, ...rest }: ProductInput): BillingProductDto => ({
  ...rest,
  currency: BILLING_PLAN.currency,
  inStripe: Boolean(id),
});

/** The plan's three prices, each marked by whether provisioning has found it in Stripe. */
const products = ({ row }: { row: Row }) => [
  product({
    key: "baseMonthly",
    amountMinor: BILLING_PLAN.baseMonthlyMinor,
    interval: "MONTH",
    id: row?.basePriceMonthlyId,
  }),
  product({
    key: "baseYearly",
    amountMinor: BILLING_PLAN.baseYearlyMinor,
    interval: "YEAR",
    id: row?.basePriceYearlyId,
  }),
  product({
    key: "seatMonthly",
    amountMinor: BILLING_PLAN.seatMonthlyMinor,
    interval: "MONTH",
    id: row?.seatPriceId,
  }),
];

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
    products: products({ row }),
    includedSeats: BILLING_PLAN.includedSeats,
    trialDays: BILLING_PLAN.trialDays,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

export const loadConfigRow = ({ db }: { db: PlatformDb }) =>
  db.billingConfig.findUnique({ where: { id: BILLING_CONFIG_ID } });

export type ConfigData = Partial<NonNullable<Row>>;

/**
 * What a key's account holds: another key may be another account or mode, so these are cleared
 * and provisioned again in that account.
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
  const { secretKey, webhookSecret } = input;
  const data: ConfigData = {};
  if (secretKey) {
    const sealed = sealSecret({ plain: secretKey });
    if (!sealed.ok) return err({ error: sealed.error });
    Object.assign(data, {
      ...STRIPE_OBJECTS_CLEARED,
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
