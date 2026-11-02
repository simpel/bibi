import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type PackageActionsProps = {
  /** `template:write`: the package create page is offered. */
  canCreatePackage: boolean;
  /** The one-off is picked: its button shows pressed. */
  oneOff: boolean;
  onOneOff: () => void;
};

/** Step 3's title-row actions: Create package (its own page) and One-off (a pick, pressed). */
export function PackageActions({ canCreatePackage, oneOff, onOneOff }: PackageActionsProps) {
  const t = useTranslations("ticketIntake.package");
  return (
    <>
      {canCreatePackage ? (
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.ticketTemplateNew}>
            <PlusIcon aria-hidden />
            {t("createPackage")}
          </Link>
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant={oneOff ? "secondary" : "outline"}
        aria-pressed={oneOff}
        onClick={onOneOff}
      >
        {t("oneOff")}
      </Button>
    </>
  );
}
