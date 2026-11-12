import {
  AccountingSettingsSchema,
  PaymentSettingsSchema,
  type SettingKey,
  SettingsOrganizationSchema,
  SettingsViewSchema,
} from "@bibi/core/schemas";
import type { z } from "zod";
import { BillingWireSchema } from "./billing-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** The settings view as tool results carry it: plain JSON, no dates to convert. */
export type SettingsViewWire = z.infer<typeof SettingsViewSchema>;

/**
 * One card per setting (`view.keys`), each editable in place by the user: the card saves through
 * the same server action as its administration section, with the same toast.
 */
export type SettingsUiProps = { "setting-cards": { view: SettingsViewWire } };

const EMPTY: Omit<SettingsViewWire, "keys"> = {
  organization: null,
  payment: null,
  accounting: null,
  seats: null,
};

type ViewInput = Partial<Omit<SettingsViewWire, "keys">> & { keys: SettingKey[] };

const view = ({ keys, ...groups }: ViewInput) => ({ view: { ...EMPTY, ...groups, keys } });

const settingsView = uiEntry({
  component: "setting-cards",
  schema: SettingsViewSchema,
  toProps: ({ value }) => ({ view: value }),
});
/** An owner read or change of the payment settings: its three settings, one card each. */
const paymentSettings = uiEntry({
  component: "setting-cards",
  schema: PaymentSettingsSchema,
  toProps: ({ value }) => view({ keys: ["paymentMethods", "deposit"], payment: value }),
});
const accountingSettings = uiEntry({
  component: "setting-cards",
  schema: AccountingSettingsSchema,
  toProps: ({ value }) => view({ keys: ["accounts"], accounting: value }),
});
const domainJoin = uiEntry({
  component: "setting-cards",
  schema: SettingsOrganizationSchema,
  toProps: ({ value }) => {
    const { timeZone, emailDomain, domainJoin } = value;
    return view({ keys: ["domainJoin"], organization: { timeZone, emailDomain, domainJoin } });
  },
});
const seats = uiEntry({
  component: "setting-cards",
  schema: BillingWireSchema,
  toProps: ({ value }) =>
    view({
      keys: ["seats"],
      seats: {
        ...value.seats,
        autoAssignSeats: value.autoAssignSeats,
        currency: value.prices.currency,
        seatMonthlyMinor: value.prices.seatMonthlyMinor,
      },
    }),
});

/** Tool → setting cards: a settings read and a settings change both answer with the cards. */
export const SETTINGS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  settings_view: settingsView,
  organizationProfile_setDomainJoin: domainJoin,
  paymentSettings_get: paymentSettings,
  paymentSettings_update: paymentSettings,
  accountingSettings_get: accountingSettings,
  accountingSettings_update: accountingSettings,
  billing_update: seats,
};
