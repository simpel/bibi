"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { setSetupStatus } from "@/features/user-preference/settings-actions";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";

/** "Skip for now": remembers the choice on the organization (ADR 0061), then opens the app. */
export function SkipOnboardingButton() {
  const t = useTranslations("onboarding");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const skip = () =>
    run({
      action: () => setSetupStatus({ setupStatus: "SKIPPED" }),
      messages: { pending: common("saving"), success: t("skipped") },
      onSuccess: () => router.push(ROUTES.home),
    });
  return (
    <Button type="button" variant="ghost" disabled={pending} onClick={skip}>
      {t("skip")}
    </Button>
  );
}
