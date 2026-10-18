import type { SheetMatch } from "@okazi/core/schemas";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type SheetMatchesProps = { matches: readonly SheetMatch[] };

/**
 * The counts that hit the ticket's items (ADR 0021): "contains" blocks the sheet, "may contain"
 * is a warning. Shared by the ticket page and the assistant's card.
 */
export function SheetMatches({ matches }: SheetMatchesProps) {
  const t = useTranslations("sheet.matches");
  if (matches.length === 0) return null;
  return (
    <ul data-slot="sheet-matches" className="grid gap-1.5 text-sm">
      {matches.map((match) => (
        <li
          key={`${match.programItemKey}:${match.vocabularyValueId}`}
          className="flex flex-wrap items-center gap-2"
        >
          <Badge variant={match.blocking ? "destructive" : "warning"}>{t(match.kind)}</Badge>
          <span>
            {t("line", {
              count: match.quantity,
              name: match.name,
              item: match.programItemName,
              carriers: match.carriers.join(", "),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
