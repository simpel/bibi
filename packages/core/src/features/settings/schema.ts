import { z } from "zod";
import { BillingSeatsSchema } from "../billing/schema";
import { AccountingSettingsSchema } from "../finance/settings-schema";
import { OrganizationProfileSchema } from "../organization-profile/schema";
import { PaymentSettingsSchema } from "../payment-account/settings-schema";

/**
 * The organization's settings one by one, named like their sections in the administration area.
 * One key is one setting the assistant shows as one card.
 */
export const SETTING_KEYS = [
  "timeZone",
  "domainJoin",
  "paymentMethods",
  "deposit",
  "fiscalYear",
  "accounts",
  "seats",
] as const;

export const SettingKeySchema = z
  .enum(SETTING_KEYS)
  .describe(
    "timeZone: the organization's time zone. domainJoin: colleagues at the email domain join " +
      "by themselves. paymentMethods: which connected provider takes each payment method " +
      "(card, Swish, invoice). deposit: the deposit rule. fiscalYear: first month of the fiscal year. " +
      "accounts: the bookkeeping accounts of the SIE export. seats: how seats are added and " +
      "how many extra seats are paid for",
  );

export type SettingKey = z.infer<typeof SettingKeySchema>;

export const SettingsViewInputSchema = z.object({
  keys: z
    .array(SettingKeySchema)
    .min(1)
    .max(SETTING_KEYS.length)
    .optional()
    .describe("The settings the user asks about; omit for all of them"),
});

export const SettingsOrganizationSchema = OrganizationProfileSchema.pick({
  timeZone: true,
  emailDomain: true,
  domainJoin: true,
});

export const SettingsSeatsSchema = BillingSeatsSchema.extend({
  autoAssignSeats: z.boolean(),
  currency: z.string(),
  seatMonthlyMinor: z.number().int().describe("Price of one extra seat a month, minor units"),
});

/** The asked settings, each group from its owner feature and gated by its `read` (ADR 0071). */
export const SettingsViewSchema = z.object({
  keys: z
    .array(SettingKeySchema)
    .describe("The asked settings the caller may read, in the asked order: one card each"),
  organization: SettingsOrganizationSchema.nullable().describe(
    "timeZone and domainJoin (configuration); null when neither was asked",
  ),
  payment: PaymentSettingsSchema.nullable().describe(
    "paymentMethods and deposit; null when not asked or without paymentAccount:read",
  ),
  accounting: AccountingSettingsSchema.nullable().describe(
    "fiscalYear and accounts; null when not asked or without finance:read",
  ),
  seats: SettingsSeatsSchema.nullable().describe(
    "seats; null when not asked or without billing:read",
  ),
});

export type SettingsViewInput = z.infer<typeof SettingsViewInputSchema>;
export type SettingsView = z.infer<typeof SettingsViewSchema>;
