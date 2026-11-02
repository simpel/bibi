import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/states/empty-state";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Step 3 without packages: One-off, or create a package (spec "No packages at all"). */
export function NoPackages({ onOneOff }: { onOneOff: () => void }) {
  const t = useTranslations("ticketIntake.package");
  const action = (
    <div className="flex flex-wrap justify-center gap-2">
      <Button type="button" onClick={onOneOff}>
        {t("oneOff")}
      </Button>
      <Button asChild variant="outline">
        <Link href={ROUTES.ticketTemplateNew}>{t("createPackage")}</Link>
      </Button>
    </div>
  );
  return <EmptyState title={t("none")} description={t("noneDescription")} action={action} />;
}
