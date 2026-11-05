import type { RunSheetMatch } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type RunSheetMatchesProps = { matches: readonly RunSheetMatch[] };

/**
 * The counts that hit the order's items (ADR 0021): "contains" blocks the run sheet, "may contain"
 * is a warning. Shared by the order page and the assistant's card.
 */
export function RunSheetMatches({ matches }: RunSheetMatchesProps) {
  const t = useTranslations("runSheet.matches");
  if (matches.length === 0) return null;
  return (
    <ul data-slot="run-sheet-matches" className="grid gap-1.5 text-sm">
      {matches.map((match) => (
        <li
          key={`${match.lineKey}:${match.vocabularyValueId}`}
          className="flex flex-wrap items-center gap-2"
        >
          <Badge variant={match.blocking ? "destructive" : "warning"}>{t(match.kind)}</Badge>
          <span>
            {t("line", {
              count: match.quantity,
              name: match.name,
              item: match.lineName,
              carriers: match.carriers.join(", "),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
