import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { TypeChoiceStep } from "@/features/welcome/ui/setup/type-choice-step";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";

type SellableStepProps = { params: Promise<{ locale: string }> };

/** The kind's sellable types, prefilled and ticked; more can be added later (ADR 0061). */
export default async function SellableStep({ params }: SellableStepProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [state, t] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.setup.sellable"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/sellable", state })}
    >
      <TypeChoiceStep bookable={false} back="setup/bookable" next="setup/review" />
    </WelcomeStepFrame>
  );
}
