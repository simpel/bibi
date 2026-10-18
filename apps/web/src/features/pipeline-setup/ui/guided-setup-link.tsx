import { Link } from "@okazi/i18n/navigation";
import { buttonVariants } from "@okazi/ui";
import { WandSparklesIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/routes";

/** Opens the guided pipeline setup from the settings (ADR 0044). */
export async function GuidedSetupLink() {
  const t = await getTranslations("pipelineSetup");
  return (
    <Link href={ROUTES.onboardingPipeline} className={buttonVariants({ variant: "outline" })}>
      <WandSparklesIcon />
      {t("open")}
    </Link>
  );
}
