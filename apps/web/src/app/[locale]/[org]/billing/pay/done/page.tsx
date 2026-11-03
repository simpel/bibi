import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { safeReturnTo } from "@/features/billing/lib/return-to";
import { FinishPayment } from "@/features/billing/ui/finish-payment";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";

type PayDonePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

/** Stripe Checkout's success URL: syncs the subscription, then opens `returnTo`. */
export default async function PayDonePage({ params, searchParams }: PayDonePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const t = await getTranslations("billing.done");
  const returnTo = safeReturnTo({ value: (await searchParams).returnTo });
  return (
    <WelcomeStepFrame title={t("title")}>
      <FinishPayment returnTo={returnTo} />
    </WelcomeStepFrame>
  );
}
