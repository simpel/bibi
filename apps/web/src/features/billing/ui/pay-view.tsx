import { getBilling, getBillingAccess } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { Link, redirect } from "@/lib/navigation";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { planTexts } from "../plan-texts";
import { PlanPicker } from "./plan-picker";
import { RemindAdminButton } from "./remind-admin-button";

export type PayViewProps = { locale: Locale; org: string; returnTo: string };

type AdminPayProps = Omit<PayViewProps, "org"> & {
  /** Paying early from the sidebar's countdown: other words, and a way back without paying. */
  inTrial: boolean;
};

/** Picks the plan for the organization with the prices from billing.get (admins only). */
async function AdminPay({ locale, returnTo, inTrial }: AdminPayProps) {
  const [t, billing] = await Promise.all([
    getTranslations("billing.pay"),
    runOperation({ operation: getBilling, input: {} }),
  ]);
  if (!billing.ok)
    return <ErrorState errorKey={handleLoadError({ error: billing.error, locale })} />;
  const { prices, seats } = billing.value;
  const texts = await planTexts({ prices, includedSeats: seats.included });
  return (
    <WelcomeStepFrame
      title={t(inTrial ? "trialTitle" : "adminTitle")}
      description={t(inTrial ? "trialDescription" : "adminDescription")}
      width="wide"
    >
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <PlanPicker plans={texts.plans} seats={texts.seats} returnTo={returnTo} />
        {inTrial ? (
          <Button asChild variant="ghost">
            <Link href={returnTo}>{t("notNow")}</Link>
          </Button>
        ) : null}
      </div>
    </WelcomeStepFrame>
  );
}

/**
 * `/:org/billing/pay` (ADR 0095 §5, §7): the trial is over. Admins pick a plan and pay; everyone
 * else can only remind them. During the trial an admin comes here from the sidebar's countdown to
 * pay early (Stripe charges from the trial's end); any other open organization goes straight back
 * to `returnTo`.
 */
export async function PayView({ locale, org, returnTo }: PayViewProps) {
  const [t, access] = await Promise.all([
    getTranslations("billing.pay"),
    runOperation({ operation: getBillingAccess, input: {} }),
  ]);
  if (!access.ok) return <ErrorState errorKey={handleLoadError({ error: access.error, locale })} />;
  const { open, state, canPay } = access.value;
  const inTrial = state === "TRIAL";
  if (open && !(inTrial && canPay)) redirect({ href: returnTo, locale, org });
  if (canPay) return <AdminPay locale={locale} returnTo={returnTo} inTrial={inTrial} />;
  return (
    <WelcomeStepFrame title={t("memberTitle")} description={t("memberDescription")}>
      <RemindAdminButton />
    </WelcomeStepFrame>
  );
}
