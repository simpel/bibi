import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/states/empty-state";

/** Step 3 without packages (spec "No packages at all"); Custom booking stays under it. */
export function NoPackages() {
  const t = useTranslations("orderIntake.package");
  return <EmptyState title={t("none")} description={t("noneDescription")} />;
}
