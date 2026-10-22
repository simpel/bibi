import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { ReviewStep } from "@/features/welcome/ui/setup/review-step";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { requireReadySession } from "@/server/guard";

type ReviewStepPageProps = { params: Promise<{ locale: string }> };

/** The chosen types and the ticket path, then Activate (ADR 0061). */
export default async function ReviewStepPage({ params }: ReviewStepPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [state, session, t] = await Promise.all([
    loadStepState({ locale }),
    requireReadySession({ locale }),
    getTranslations("welcome.setup.review"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/review", state })}
      width="wide"
    >
      <ReviewStep organization={session.organizationName} />
    </WelcomeStepFrame>
  );
}
