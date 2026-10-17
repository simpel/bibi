import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ReferenceEntry } from "../reference/types";

export type EntryBadgesProps = { entry: ReferenceEntry };

/** Read-only / changes data, AI approval and the permission the caller needs. */
export function EntryBadges({ entry }: EntryBadgesProps) {
  const t = useTranslations("docs.reference");
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={entry.readOnly ? "secondary" : "outline"}>
        {entry.readOnly ? t("readOnly") : t("changesData")}
      </Badge>
      {entry.approval && <Badge variant="warning">{t("approval")}</Badge>}
      <Badge variant="outline" className="font-mono">
        {entry.permission}
      </Badge>
    </div>
  );
}
