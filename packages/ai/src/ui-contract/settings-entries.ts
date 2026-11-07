import {
  AccountingSettingsSchema,
  OrganizationProfileSchema,
  PaymentSettingsSchema,
} from "@bibi/core/schemas";
import type { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** The organization settings as tool results carry them: plain JSON, no dates to convert. */
export type OrganizationSettingsWire = z.infer<typeof OrganizationProfileSchema>;
export type PaymentSettingsWire = z.infer<typeof PaymentSettingsSchema>;
export type AccountingSettingsWire = z.infer<typeof AccountingSettingsSchema>;

/**
 * Props of the settings cards: each shows one administration page's settings, editable in place
 * by the user (the card saves through the same server actions as the page, with a toast).
 */
export type SettingsUiProps = {
  "organization-settings-card": { profile: OrganizationSettingsWire };
  "payment-settings-card": { settings: PaymentSettingsWire };
  "accounting-settings-card": { settings: AccountingSettingsWire };
};

const organizationSettingsCard = uiEntry({
  component: "organization-settings-card",
  schema: OrganizationProfileSchema,
  toProps: ({ value }) => ({ profile: value }),
});
const paymentSettingsCard = uiEntry({
  component: "payment-settings-card",
  schema: PaymentSettingsSchema,
  toProps: ({ value }) => ({ settings: value }),
});
const accountingSettingsCard = uiEntry({
  component: "accounting-settings-card",
  schema: AccountingSettingsSchema,
  toProps: ({ value }) => ({ settings: value }),
});

/** Tool → settings card: reading a setting and changing it both answer with the editable card. */
export const SETTINGS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  organizationProfile_get: organizationSettingsCard,
  organizationProfile_update: organizationSettingsCard,
  organizationProfile_setDomainJoin: organizationSettingsCard,
  paymentSettings_get: paymentSettingsCard,
  paymentSettings_update: paymentSettingsCard,
  accountingSettings_get: accountingSettingsCard,
  accountingSettings_update: accountingSettingsCard,
};
