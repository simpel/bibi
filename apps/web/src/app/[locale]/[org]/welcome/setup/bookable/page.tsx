import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { TypeChoiceStep } from "@/features/welcome/ui/setup/type-choice-step";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";

type BookableStepProps = { params: Promise<{ locale: string }> };

/** The kind's bookable types, prefilled and ticked; more can be added later (ADR 0061). */
export default async function BookableStep({ params }: BookableStepProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [state, t] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.setup.bookable"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/bookable", state })}
    >
      <TypeChoiceStep bookable={true} back="setup/kind" next="setup/sellable" />
    </WelcomeStepFrame>
  );
}
