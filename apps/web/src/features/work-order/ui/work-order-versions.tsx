import type { DateTimeFormat, WorkOrderDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { CurrentVersionBadge } from "./current-version-badge";

export type WorkOrderVersionsProps = {
  /** Every version of the same ticket and definition, newest first. */
  versions: WorkOrderDto[];
  /** The version on screen, highlighted and not linked. */
  shownId: string;
  dates: DateTimeFormat;
};

/** All versions of one work order as links to their pages, the current one badged. */
export function WorkOrderVersions({ versions, shownId, dates }: WorkOrderVersionsProps) {
  const t = useTranslations("workOrder");
  if (versions.length < 2) return null;
  return (
    <nav aria-label={t("versions")} className="grid gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{t("versions")}</h2>
      <ol className="grid gap-1 text-sm">
        {versions.map((version) => {
          const label = t("versionCreated", {
            version: version.version,
            when: dates.dateTime({ instant: version.createdAt }),
          });
          const shown = version.id === shownId;
          return (
            <li key={version.id} className="flex flex-wrap items-center gap-2">
              {shown ? (
                <span aria-current="page" className="font-medium">
                  {label}
                </span>
              ) : (
                <Link
                  href={listItemRoute({ list: ROUTES.workOrders, id: version.id })}
                  className="underline-offset-4 hover:underline"
                >
                  {label}
                </Link>
              )}
              {version.current ? <CurrentVersionBadge current version={version.version} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
