import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { TypeChoiceStep } from "@/features/welcome/ui/setup/type-choice-step";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { pageTitle } from "@/lib/page-metadata";

type FoodStepProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: FoodStepProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "setup.food.title" });
}

/** The kind's food and beverage types, prefilled and ticked; more can be added later (ADR 0061). */
export default async function FoodStep({ params }: FoodStepProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [state, t] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.setup.food"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/food", state })}
    >
      <TypeChoiceStep category="food" back="setup/spaces" next="setup/extras" />
    </WelcomeStepFrame>
  );
}
