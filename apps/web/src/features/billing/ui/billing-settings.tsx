import { getBilling, listSeatRequests } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { planTexts } from "../plan-texts";
import { PlanCard } from "./plan-card";
import { SeatRequestsCard } from "./seat-requests-card";
import { SeatsCard } from "./seats-card";

export type BillingSettingsProps = { locale: Locale };

/** `/settings/billing` (ADR 0095): the plan, the seats and the invitations waiting for one. */
export async function BillingSettings({ locale }: BillingSettingsProps) {
  const t = await getTranslations("billing");
  const [billing, requests, abilities] = await Promise.all([
    runOperation({ operation: getBilling, input: {} }),
    runOperation({ operation: listSeatRequests, input: {} }),
    getCallerAbilities(),
  ]);
  const header = <PageHeader title={t("title")} description={t("description")} />;
  const error = !billing.ok ? billing.error : !requests.ok ? requests.error : null;
  if (error || !billing.ok || !requests.ok) {
    return (
      <div className="grid gap-8">
        {header}
        {error ? <ErrorState errorKey={handleLoadError({ error, locale })} /> : null}
      </div>
    );
  }
  const canEdit = can({ abilities, permission: "billing:write" });
  const { prices, seats } = billing.value;
  const texts = await planTexts({ prices, includedSeats: seats.included });
  return (
    <div className="grid gap-6">
      {header}
      <PlanCard billing={billing.value} texts={texts} canEdit={canEdit} />
      <SeatsCard billing={billing.value} seatPrice={texts.seatPrice} canEdit={canEdit} />
      <SeatRequestsCard
        requests={requests.value.items}
        seatPrice={texts.seatPrice}
        canEdit={canEdit}
      />
    </div>
  );
}
