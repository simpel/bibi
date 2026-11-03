/** Bibi's one plan (ADR 0095). Amounts in öre, excluding VAT (Stripe Tax adds it). */
export const BILLING_PLAN = {
  currency: "sek",
  trialDays: 14,
  includedSeats: 10,
  baseMonthlyMinor: 999_000,
  /** 12 months with 10 % off. */
  baseYearlyMinor: 10_789_200,
  /** Per extra seat and month, on every plan, never discounted. */
  seatMonthlyMinor: 4_900,
} as const;

/** Stripe lookup keys: `billingConfig.provision` finds or creates the prices by them. */
export const BILLING_LOOKUP_KEYS = {
  baseMonthly: "bibi_base_monthly",
  baseYearly: "bibi_base_yearly",
  seatMonthly: "bibi_seat_monthly",
} as const;

/** How long `billing.remindAdmins` waits before mailing the admins again. */
export const REMIND_INTERVAL_MS = 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialEndInput = { organizationCreatedAt: Date; trialEndsAt: Date | null };

/** The trial's end: the stored override, else the organization's creation plus the trial. */
export function effectiveTrialEnd({ organizationCreatedAt, trialEndsAt }: TrialEndInput): Date {
  return trialEndsAt ?? new Date(organizationCreatedAt.getTime() + BILLING_PLAN.trialDays * DAY_MS);
}
