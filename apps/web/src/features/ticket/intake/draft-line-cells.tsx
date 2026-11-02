import type { PreviewLine } from "@bibi/core";
import { cn, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { DraftLine } from "./draft-line";
import type { LineDetails } from "./line-details";
import { lineTone, TONE_CLASS, useIssueText } from "./use-issue-text";

/** One row of the lines table. */
export type DraftLineRow = {
  line: DraftLine;
  planned: PreviewLine | null;
  details: LineDetails;
  /** The time as written, empty for an untimed line. */
  time: string;
};

/** The name, then setup, choices, needs, price override and note on a second row. */
export function LineNameCell({ row }: { row: DraftLineRow }) {
  const t = useTranslations("ticketIntake.lines");
  const { details } = row;
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
      <span className="font-medium">{row.line.name}</span>
      {parts.length > 0 ? (
        <span className="truncate text-xs text-muted-foreground">{parts.join(" · ")}</span>
      ) : null}
    </div>
  );
}

/** ✓, ⚠ or ✕ with the issue text; nothing while the preview is not ready. */
export function AvailabilityCell({ row, hidden }: { row: DraftLineRow; hidden: boolean }) {
  const t = useTranslations("ticketIntake.line");
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

export type LineActionsProps = {
  row: DraftLineRow;
  onEdit: (input: { line: DraftLine }) => void;
  onRemove: (input: { key: string }) => void;
};

/** Edit opens the line dialog; Remove drops the draft line (nothing is saved until Create). */
export function LineActions({ row, onEdit, onRemove }: LineActionsProps) {
  const common = useTranslations("common");
  const t = useTranslations("ticketIntake.line");
  return (
    <DataTableRowActions label={common("actions")}>
      <DropdownMenuItem onSelect={() => onEdit({ line: row.line })}>
        {common("edit")}
      </DropdownMenuItem>
      <DropdownMenuItem destructive onSelect={() => onRemove({ key: row.line.key })}>
        {t("remove")}
      </DropdownMenuItem>
    </DataTableRowActions>
  );
}
