import { Button, DialogFooter } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type RequirementSetupNoticeProps = {
  /** What is missing: a requirement type, or a list to count against. */
  missing: "type" | "list";
  /** The caller may set it up: a link to do so, else a word to ask an admin. */
  canSetUp: boolean;
  onDone: () => void;
};

/** In place of the form when the organization has no requirement type or no list yet. */
export function RequirementSetupNotice({ missing, canSetUp, onDone }: RequirementSetupNoticeProps) {
  const t = useTranslations("requirement.setup");
  const common = useTranslations("common");
  const href = missing === "type" ? ROUTES.typeNew : ROUTES.adminLists;
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        {t(`${missing}.description`)} {canSetUp ? null : t("askAdmin")}
      </p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("cancel")}
        </Button>
        {canSetUp ? (
          <Button asChild>
            <Link href={href}>{t(`${missing}.action`)}</Link>
          </Button>
        ) : null}
      </DialogFooter>
    </div>
  );
}
