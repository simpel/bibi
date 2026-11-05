import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type PackageActionsProps = {
  /** `template:write`: the package create page is offered. */
  canCreatePackage: boolean;
};

/** Step 3's title-row action: Create package (its own page). */
export function PackageActions({ canCreatePackage }: PackageActionsProps) {
  const t = useTranslations("orderIntake.package");
  if (!canCreatePackage) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={ROUTES.orderTemplateNew}>
        <PlusIcon aria-hidden />
        {t("createPackage")}
      </Link>
    </Button>
  );
}
