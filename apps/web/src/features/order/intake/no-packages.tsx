import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/states/empty-state";

/**
 * Step 3 without packages (spec "No packages at all"), or, started from a calendar slot, none
 * that books its resource; Custom booking stays under it.
 */
export function NoPackages({ fromSlot }: { fromSlot: boolean }) {
  const t = useTranslations("orderIntake.package");
  if (fromSlot)
    return <EmptyState title={t("noneForSlot")} description={t("noneForSlotDescription")} />;
  return <EmptyState title={t("none")} description={t("noneDescription")} />;
}
