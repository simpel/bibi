import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import { loadBillingDto } from "../billing/to-billing-dto";
import { loadAccountingSettings } from "../finance/load-settings";
import {
  EMPTY_ORGANIZATION_PROFILE,
  loadOrganizationProfile,
} from "../organization-profile/load-organization-profile";
import { loadPaymentSettings } from "../payment-account/settings-store";
import { SETTING_KEYS, type SettingKey, type SettingsView } from "./schema";

/** Which group answers each setting, and the feature whose `read` it needs (ADR 0071). */
const GROUP_OF: Record<
  SettingKey,
  { group: Exclude<keyof SettingsView, "keys">; feature: Feature }
> = {
  timeZone: { group: "organization", feature: "configuration" },
  domainJoin: { group: "organization", feature: "configuration" },
  paymentMethods: { group: "payment", feature: "paymentAccount" },
  deposit: { group: "payment", feature: "paymentAccount" },
  accounts: { group: "accounting", feature: "finance" },
  seats: { group: "seats", feature: "billing" },
};

type Context = Pick<OperationContext, "db" | "organizationId" | "permissions">;

export type LoadSettingsViewInput = { context: Context; keys: readonly SettingKey[] | undefined };

/**
 * The asked settings the caller may read (unique, in the asked order), and only their groups'
 * reads: a group nobody asked for, or whose feature the caller cannot read, stays `null`.
 */
export async function loadSettingsView({
  context,
  keys,
}: LoadSettingsViewInput): Promise<SettingsView> {
  const readable = [...new Set(keys ?? SETTING_KEYS)].filter((key) =>
    canView({ context, feature: GROUP_OF[key].feature }),
  );
  const wants = new Set(readable.map((key) => GROUP_OF[key].group));
  const [profile, payment, accounting, billing] = await Promise.all([
    wants.has("organization") ? loadOrganizationProfile({ context }) : null,
    wants.has("payment") ? loadPaymentSettings({ context }) : null,
    wants.has("accounting") ? loadAccountingSettings({ context }) : null,
    wants.has("seats") ? loadBillingDto({ context }) : null,
  ]);
  const { timeZone, emailDomain, domainJoin } = profile ?? EMPTY_ORGANIZATION_PROFILE;
  const seats = billing
    ? {
        ...billing.seats,
        autoAssignSeats: billing.autoAssignSeats,
        currency: billing.prices.currency,
        seatMonthlyMinor: billing.prices.seatMonthlyMinor,
      }
    : null;
  return {
    keys: readable,
    organization: wants.has("organization") ? { timeZone, emailDomain, domainJoin } : null,
    payment: visibleTo({ context, feature: "paymentAccount", value: payment }),
    accounting: visibleTo({ context, feature: "finance", value: accounting }),
    seats: visibleTo({ context, feature: "billing", value: seats }),
  };
}
