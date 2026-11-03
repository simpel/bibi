import { getBilling, getBillingAccess } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { redirect } from "@/lib/navigation";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { planTexts } from "../plan-texts";
import { PlanPicker } from "./plan-picker";
import { RemindAdminButton } from "./remind-admin-button";

export type PayViewProps = { locale: Locale; org: string; returnTo: string };

/** Picks the plan for the organization with the prices from billing.get (admins only). */
async function AdminPay({ locale, returnTo }: Omit<PayViewProps, "org">) {
  const t = await getTranslations("billing.pay");
  const billing = await runOperation({ operation: getBilling, input: {} });
  if (!billing.ok)
    return <ErrorState errorKey={handleLoadError({ error: billing.error, locale })} />;
  const { prices, seats } = billing.value;
  const texts = await planTexts({ prices, includedSeats: seats.included });
  return (
    <WelcomeStepFrame title={t("adminTitle")} description={t("adminDescription")} width="wide">
      <div className="mx-auto w-full max-w-2xl">
        <PlanPicker plans={texts.plans} seats={texts.seats} returnTo={returnTo} />
      </div>
    </WelcomeStepFrame>
  );
}

/**
 * `/:org/billing/pay` (ADR 0095 §5, §7): the trial is over. Admins pick a plan and pay; everyone
 * else can only remind them. An open organization goes straight back to `returnTo`.
 */
export async function PayView({ locale, org, returnTo }: PayViewProps) {
  const t = await getTranslations("billing.pay");
  const access = await runOperation({ operation: getBillingAccess, input: {} });
  if (!access.ok) return <ErrorState errorKey={handleLoadError({ error: access.error, locale })} />;
  if (access.value.open) redirect({ href: returnTo, locale, org });
  if (access.value.canPay) return <AdminPay locale={locale} returnTo={returnTo} />;
  return (
    <WelcomeStepFrame title={t("memberTitle")} description={t("memberDescription")}>
      <RemindAdminButton />
    </WelcomeStepFrame>
  );
}
