import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { TypeChoiceStep } from "@/features/welcome/ui/setup/type-choice-step";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { pageTitle } from "@/lib/page-metadata";

type SpacesStepProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: SpacesStepProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "setup.spaces.title" });
}

/** The kind's space and room types, prefilled and ticked; more can be added later (ADR 0061). */
export default async function SpacesStep({ params }: SpacesStepProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [state, t] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.setup.spaces"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/spaces", state })}
    >
      <TypeChoiceStep category="spaces" back="setup/kind" next="setup/food" />
    </WelcomeStepFrame>
  );
}
