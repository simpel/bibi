import { resolveLocale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { loadStepState } from "@/features/welcome/load-step-state";
import { KindGrid } from "@/features/welcome/ui/setup/kind-grid";
import { SkipSetupButton } from "@/features/welcome/ui/setup/skip-setup-button";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { Link } from "@/lib/navigation";

type KindStepProps = { params: Promise<{ locale: string; org: string }> };

/** What kind of place: nine venue kinds plus "Start empty" (ADR 0061). */
export default async function KindStep({ params }: KindStepProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const [state, t, welcome] = await Promise.all([
    loadStepState({ locale }),
    getTranslations("welcome.setup.kind"),
    getTranslations("welcome"),
  ]);
  return (
    <WelcomeStepFrame
      title={t("title")}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/kind", state })}
      width="wide"
    >
      <KindGrid />
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href={welcomePath({ step: "setup/organization" })} org={org}>
            {welcome("back")}
          </Link>
        </Button>
        <SkipSetupButton org={org} />
      </div>
    </WelcomeStepFrame>
  );
}
