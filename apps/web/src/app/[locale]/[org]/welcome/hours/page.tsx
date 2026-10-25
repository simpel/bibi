import { DEFAULT_WORKING_HOURS } from "@bibi/core/schemas";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { rowsFromDays } from "@/features/hours/lib/hours";
import { loadStepState } from "@/features/welcome/load-step-state";
import { HoursForm } from "@/features/welcome/ui/hours/hours-form";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";

type HoursStepProps = { params: Promise<{ locale: string; org: string }> };

/** Working hours: Monday–Friday 08–17 with lunch 12–13 unless the user saved others. */
export default async function HoursStep({ params }: HoursStepProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const [state, t] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.hours"),
  ]);
  const days = state.hours.days.length > 0 ? state.hours.days : DEFAULT_WORKING_HOURS;
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "hours", state })}
    >
      <HoursForm org={org} rows={rowsFromDays({ days })} />
    </WelcomeStepFrame>
  );
}
