import { getBilling, listSeatRequests } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { planTexts } from "../plan-texts";
import { PlanCard } from "./plan-card";
import { SeatRequestsCard } from "./seat-requests-card";
import { SeatsCard } from "./seats-card";

export type BillingSettingsProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/** `/admin/billing` (ADR 0095): the plan, the seats and the invitations waiting for one. */
export async function BillingSettings({ locale, show }: BillingSettingsProps) {
  const [t, billing, requests, abilities] = await Promise.all([
    getTranslations("billing.settings"),
    runOperation({ operation: getBilling, input: {} }),
    runOperation({ operation: listSeatRequests, input: {} }),
    getCallerAbilities(),
  ]);
  if (!billing.ok || !requests.ok) {
    const error = !billing.ok ? billing.error : !requests.ok ? requests.error : null;
    const state = error ? (
      <ErrorState inline errorKey={handleLoadError({ error, locale })} />
    ) : null;
    return (
      <>
        {show.has("plan") ? (
          <AdminSection id="plan" title={t("planTitle")}>
            {state}
          </AdminSection>
        ) : null}
        {show.has("seats") ? (
          <AdminSection id="seats" title={t("seatsTitle")}>
            {state}
          </AdminSection>
        ) : null}
        {show.has("seatRequests") ? (
          <AdminSection id="seat-requests" title={t("requestsTitle")}>
            {state}
          </AdminSection>
        ) : null}
      </>
    );
  }
  const canEdit = can({ abilities, permission: "billing:write" });
  const { prices, seats } = billing.value;
  const texts = await planTexts({ prices, includedSeats: seats.included });
  return (
    <>
      {show.has("plan") ? (
        <PlanCard billing={billing.value} texts={texts} canEdit={canEdit} />
      ) : null}
      {show.has("seats") ? (
        <SeatsCard billing={billing.value} seatPrice={texts.seatPrice} canEdit={canEdit} />
      ) : null}
      {show.has("seatRequests") ? (
        <SeatRequestsCard
          requests={requests.value.items}
          seatPrice={texts.seatPrice}
          canEdit={canEdit}
        />
      ) : null}
    </>
  );
}
