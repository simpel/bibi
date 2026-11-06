import { Button } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { type WelcomeStep, welcomePath } from "../../lib/welcome-step";

export type ReviewListsProps = { org?: string; spaces: string[]; food: string[]; extras: string[] };

type ReviewListProps = { org?: string; title: string; names: string[]; step: WelcomeStep };

/** One chosen category, with Edit back to the step that set it. */
function ReviewList({ org, title, names, step }: ReviewListProps) {
  const t = useTranslations("welcome.setup.review");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  return (
    <section className="grid gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={welcomePath({ step })} org={org} aria-label={`${tCommon("edit")}: ${title}`}>
            {tCommon("edit")}
          </Link>
        </Button>
      </div>
      {names.length > 0 ? (
        <p className="text-sm">{format.list(names, { type: "conjunction" })}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      )}
    </section>
  );
}

/** The chosen types, in three short lists. */
export function ReviewLists({ org, spaces, food, extras }: ReviewListsProps) {
  const t = useTranslations("welcome.setup.review");
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ReviewList org={org} title={t("spaces")} names={spaces} step="setup/spaces" />
      <ReviewList org={org} title={t("food")} names={food} step="setup/food" />
      <ReviewList org={org} title={t("extras")} names={extras} step="setup/extras" />
    </div>
  );
}
