import { Badge } from "@bibi/ui";
import { CircleCheckIcon, HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type CurrentVersionBadgeProps = { current: boolean; version: number };

/**
 * Whether a version is the one to work from: green "Current version", or amber "Not the current
 * version" on every older one, so a stale printout or link is never mistaken for the latest.
 */
export function CurrentVersionBadge({ current, version }: CurrentVersionBadgeProps) {
  const t = useTranslations("runSheet");
  return (
    <Badge
      data-slot="current-version-badge"
      variant={current ? "success" : "warning"}
      title={t("version", { version })}
    >
      {current ? <CircleCheckIcon /> : <HistoryIcon />}
      {current ? t("currentVersion") : t("notCurrentVersion")}
    </Badge>
  );
}
