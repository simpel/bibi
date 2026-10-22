import { resolveLocale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { requireReadySession } from "@/server/guard";

type DoneStepProps = { params: Promise<{ locale: string; org: string }> };

/** The end of the flow: ready, or waiting for an admin to finish the setup (ADR 0061). */
export default async function DoneStep({ params }: DoneStepProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const [state, session, t] = await Promise.all([
    loadStepState({ locale }),
    requireReadySession({ locale }),
    getTranslations("welcome.done"),
  ]);
  const organization = session.organizationName;
  const waiting = state.organization.setupStatus === "PENDING";
  return (
    <WelcomeStepFrame
      title={waiting ? t("pendingTitle") : t("title")}
      description={
        waiting
          ? t("pendingDescription", { organization })
          : t("readyDescription", { organization })
      }
    >
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href={ROUTES.pipeline} org={org}>
            {t("goToBoard")}
          </Link>
        </Button>
      </div>
    </WelcomeStepFrame>
  );
}
