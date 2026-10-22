"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { skipSetupAction } from "../../setup-actions";

/** "Skip for now": the setup becomes SKIPPED and the board opens (ADR 0061). */
export function SkipSetupButton({ org }: { org: string }) {
  const t = useTranslations("welcome");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const skip = () =>
    run({
      action: () => skipSetupAction(),
      messages: { pending: common("saving"), success: t("skipped") },
      onSuccess: () => router.push(ROUTES.pipeline, { org }),
    });
  return (
    <Button type="button" variant="ghost" disabled={pending} onClick={skip}>
      {t("skipForNow")}
    </Button>
  );
}
