import type { LineDto } from "@bibi/core";
import { Badge, type ColumnDef } from "@bibi/ui";
import { CornerDownRightIcon, TriangleAlertIcon } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { MissingCell, openGroupNames, pickLabel } from "./line-missing";
import { bySeverity } from "./line-warning-severity";

type Translator = ReturnType<typeof useTranslations<"line">>;
type EffectTranslator = ReturnType<typeof useTranslations<"priceEffect">>;

export type NameColumnInput = {
  t: Translator;
  effects: EffectTranslator;
  onEdit?: (line: LineDto) => void;
  /** Customisation group names by id, so an open required choice says which group it is. */
  groupNames: ReadonlyMap<string, string>;
  /** After the name and badges, e.g. the line's comments (ADR 0115). */
  extra?: ((line: LineDto) => ReactNode) | undefined;
};

type WorstWarningProps = { t: Translator; warnings: LineDto["warnings"] };

/**
 * One badge per line: its most severe warning other than an open choice (that one is the amber
 * "Pick …" mark), every warning's sentence in the tooltip.
 */
function WorstWarning({ t, warnings }: WorstWarningProps) {
  const [worst] = bySeverity({ warnings }).filter(({ kind }) => kind !== "UNCHOSEN_REQUIRED_GROUP");
  if (!worst) return null;
  const sentence = ({ warning }: { warning: LineDto["warnings"][number] }) =>
    t(`warnings.${warning.kind}`, { sum: warning.sum ?? 0, expected: warning.expected ?? 0 });
  const all = bySeverity({ warnings }).map((warning) => sentence({ warning }));
  return (
    <Badge variant="warning" title={all.join("\n")}>
      <TriangleAlertIcon aria-hidden />
      {t(`warningsShort.${worst.kind}`)}
    </Badge>
  );
}

/**
 * The line's name. A part, option or add-on line (ADR 0059, 0088) is indented under its parent
 * with an arrow and marked: a part with "Part" (its bundle line carries the price), an option with
 * its price effect unless it is included, an add-on with "Add-on" (its own time, quantity and
 * price). A required choice still open shows as the amber "Pick <group>" mark, which opens the
 * line where it is chosen; of the other warnings only the most severe shows, as a triangle and a
 * short label, its tooltip with the full sentence of every warning on the line.
 * Clicking the name triggers line edit, matching the pen action button.
 */
export function nameColumn({
  t,
  effects,
  onEdit,
  groupNames,
  extra,
}: NameColumnInput): ColumnDef<LineDto> {
  return {
    id: "name",
    header: t("columns.name"),
    accessorFn: (item) => item.name,
    footer: () => t("total"),
    cell: ({ row: { original } }) => (
      <span
        className={
          original.parentLineId ? "flex items-center gap-2 pl-2" : "flex items-center gap-2"
        }
      >
        {original.parentLineId ? (
          <CornerDownRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        ) : null}
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(original);
            }}
            className="cursor-pointer text-left font-medium hover:underline focus-visible:underline outline-none"
          >
            {original.name}
          </button>
        ) : (
          <span>{original.name}</span>
        )}
        {original.role === "PART" ||
        (original.role === "OPTION" && original.priceEffect !== "INCLUDED") ? (
          <Badge variant="outline">
            {original.role === "OPTION" && original.priceEffect
              ? effects(original.priceEffect)
              : t("part")}
          </Badge>
        ) : null}
        {original.role === "ADD_ON" ? <Badge variant="outline">{t("addOn")}</Badge> : null}
        {original.warnings.some(({ kind }) => kind === "UNCHOSEN_REQUIRED_GROUP") ? (
          <MissingCell
            label={pickLabel({ t, names: openGroupNames({ line: original, groupNames }) })}
            onOpen={onEdit ? () => onEdit(original) : undefined}
          />
        ) : null}
        <WorstWarning t={t} warnings={original.warnings} />
        {extra?.(original)}
      </span>
    ),
  };
}
