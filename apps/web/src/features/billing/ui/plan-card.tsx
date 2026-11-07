import type { BillingDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { getDateTimeFormat } from "@/server/date-time-format";
import { isSubscribed } from "../lib/billing-status";
import type { PlanTexts } from "../plan-texts";
import { AddPaymentButton } from "./add-payment-button";
import { BillingStateBadge } from "./billing-state-badge";
import { ManageBillingButton } from "./manage-billing-button";

const RETURN_TO = "/admin/billing";

export type PlanCardProps = { billing: BillingDto; texts: PlanTexts; canEdit: boolean };

type FactProps = { label: string; value: string };

function Fact({ label, value }: FactProps) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** The plan and its state: trial end, interval, next payment, and the way to pay or manage. */
export async function PlanCard({ billing, texts, canEdit }: PlanCardProps) {
  const [t, intervals, dates] = await Promise.all([
    getTranslations("billing.settings"),
    getTranslations("billing.interval"),
    getDateTimeFormat(),
  ]);
  const { access, interval, currentPeriodEnd, cancelAtPeriodEnd } = billing;
  const subscribed = isSubscribed({ subscriptionStatus: billing.subscriptionStatus });
  const periodEnd = currentPeriodEnd ? dates.date({ instant: currentPeriodEnd }) : t("none");
  return (
    <AdminSection
      id="plan"
      title={t("planTitle")}
      actions={<BillingStateBadge state={access.state} />}
    >
      <div className="grid gap-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          {access.state === "TRIAL" ? (
            <Fact label={t("trialEndsAt")} value={dates.date({ instant: access.trialEndsAt })} />
          ) : null}
          <Fact label={t("interval")} value={interval ? intervals(interval) : t("noPlan")} />
          <Fact label={cancelAtPeriodEnd ? t("endsOn") : t("periodEnd")} value={periodEnd} />
        </dl>
        {cancelAtPeriodEnd ? (
          <p className="text-muted-foreground">{t("cancelAtPeriodEnd")}</p>
        ) : null}
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            {subscribed ? null : (
              <AddPaymentButton plans={texts.plans} seats={texts.seats} returnTo={RETURN_TO} />
            )}
            {billing.hasCustomer ? <ManageBillingButton returnTo={RETURN_TO} /> : null}
          </div>
        ) : (
          <p className="text-muted-foreground">{t("readOnly")}</p>
        )}
      </div>
    </AdminSection>
  );
}
