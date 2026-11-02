import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/states/empty-state";

/** Step 3 without packages (spec "No packages at all"); One-off and Create are the step's actions. */
export function NoPackages() {
  const t = useTranslations("ticketIntake.package");
  return <EmptyState title={t("none")} description={t("noneDescription")} />;
}
