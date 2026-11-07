"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCan } from "@/components/shell/permissions-context";
import { AutoAssignSwitch } from "@/features/billing/ui/auto-assign-switch";
import { BillingStateBadge } from "@/features/billing/ui/billing-state-badge";
import { ExtraSeatsForm } from "@/features/billing/ui/extra-seats-form";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { SettingRow, SettingsCard } from "./settings-card";

export type BillingCardViewProps = GenerativeProps<"billing-card">;

/**
 * The organization's Bibi subscription: state and trial end, then the seat settings, editable in
 * place (how new seats are added, the extra seats). The plan is changed on the billing page.
 */
export function BillingCardView({ billing }: BillingCardViewProps) {
  const t = useTranslations("assistant.ui.billing");
  const format = useDateTimeFormat();
  const numbers = useNumberFormat();
  const canEdit = useCan({ permission: "billing:write" });
  const [seatSettings, setSeatSettings] = useState({
    autoAssignSeats: billing.autoAssignSeats,
    seats: billing.seats,
  });
  const { access, prices } = billing;
  const { seats } = seatSettings;
  const onSaved = ({ value }: { value: { autoAssignSeats: boolean; seats: typeof seats } }) =>
    setSeatSettings({ autoAssignSeats: value.autoAssignSeats, seats: value.seats });
  return (
    <SettingsCard slot="billing-card" title={t("singular")} href={ROUTES.adminBilling}>
      <SettingRow section="plan" action={<BillingStateBadge state={access.state} />}>
        {access.state === "TRIAL" ? (
          <p>{t("trialEndsAt", { date: format.date({ instant: access.trialEndsAt }) })}</p>
        ) : null}
      </SettingRow>
      <SettingRow
        section="seats"
        description={t("seats", {
          used: seats.used,
          total: seats.included + seats.extra,
          held: seats.held,
        })}
      >
        <AutoAssignSwitch
          enabled={seatSettings.autoAssignSeats}
          canEdit={canEdit}
          onSaved={onSaved}
        />
        <ExtraSeatsForm
          extraSeats={seats.extra}
          seatPrice={numbers.money({ minor: prices.seatMonthlyMinor, currency: prices.currency })}
          canEdit={canEdit}
          onSaved={onSaved}
        />
      </SettingRow>
    </SettingsCard>
  );
}
