import { Badge, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { DraftLineRow } from "./review-rows";
import { lineTone, TONE_CLASS, useIssueText } from "./use-issue-text";

export type { DraftLineRow };

/** An add-on's name, indented under its line with an "Add-on" badge (ADR 0088). */
function AddOnName({ row }: { row: DraftLineRow }) {
  const t = useTranslations("orderIntake.lines");
  return (
    <span className="flex min-w-0 items-center gap-2 pl-4">
      <span className="truncate">{row.name}</span>
      <Badge variant="outline">{t("addOn")}</Badge>
    </span>
  );
}

/** The name, then setup, choices, needs, price override and note on a second row. */
export function LineNameCell({ row }: { row: DraftLineRow }) {
  const t = useTranslations("orderIntake.lines");
  const { details } = row;
  if (!details) return <AddOnName row={row} />;
  const parts = [
    details.setup,
    ...details.choices.map(({ name, quantity }) =>
      quantity === null ? name : `${name} ${quantity}`,
    ),
    ...details.needs.map(({ name, quantity }) => `${name} ${quantity}`),
    details.discountPercent === null ? null : t("discount", { percent: details.discountPercent }),
    details.note,
  ].filter((part): part is string => Boolean(part));
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="font-medium">{row.name}</span>
      {parts.length > 0 ? (
        <span className="truncate text-xs text-muted-foreground">{parts.join(" · ")}</span>
      ) : null}
    </div>
  );
}

/** ✓, ⚠ or ✕ with the issue text; nothing while the preview is not ready. */
export function AvailabilityCell({ row, hidden }: { row: DraftLineRow; hidden: boolean }) {
  const t = useTranslations("orderIntake.line");
  const issueText = useIssueText();
  if (hidden) return null;
  const tone = lineTone({ planned: row.planned });
  const first = row.planned?.issues[0];
  return (
    <span className={cn("text-sm", TONE_CLASS[tone])}>
      {t(`tone.${tone}`)}
      {first ? ` ${issueText({ issue: first })}` : ""}
    </span>
  );
}
