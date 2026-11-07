"use client";

import type { BillingDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { AutoAssignSwitch } from "@/features/billing/ui/auto-assign-switch";
import { ExtraSeatsForm } from "@/features/billing/ui/extra-seats-form";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { SettingCard } from "./setting-card";
import type { SettingCardProps } from "./setting-props";

/** Seats (ADR 0095): what is used, how new seats are added and the extra paid seats. */
export function SeatsSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("assistant.ui.billing");
  const numbers = useNumberFormat();
  const canEdit = useCan({ permission: "billing:write" });
  if (!view.seats) return null;
  const seats = view.seats;
  const saved = ({ value }: { value: BillingDto }) =>
    onSaved({
      patch: {
        seats: { ...seats, ...value.seats, autoAssignSeats: value.autoAssignSeats },
      },
    });
  return (
    <SettingCard
      setting="seats"
      description={t("seats", {
        used: seats.used,
        total: seats.included + seats.extra,
        held: seats.held,
      })}
    >
      <AutoAssignSwitch enabled={seats.autoAssignSeats} canEdit={canEdit} onSaved={saved} />
      <ExtraSeatsForm
        extraSeats={seats.extra}
        seatPrice={numbers.money({ minor: seats.seatMonthlyMinor, currency: seats.currency })}
        canEdit={canEdit}
        onSaved={saved}
      />
    </SettingCard>
  );
}
