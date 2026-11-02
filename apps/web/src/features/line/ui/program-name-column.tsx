import type { LineDto } from "@bibi/core";
import { Badge, type ColumnDef } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"line">>;
type EffectTranslator = ReturnType<typeof useTranslations<"priceEffect">>;

export type NameColumnInput = { t: Translator; effects: EffectTranslator };

/**
 * The line's name. A part, option or add-on line (ADR 0059, 0088) is indented and marked: a part
 * with "Part" (its bundle line carries the price), an option with its price effect, an add-on with
 * "Add-on" (its own time, quantity and price). A warning shows a triangle and a short label, the
 * full sentence as its tooltip.
 */
export function nameColumn({ t, effects }: NameColumnInput): ColumnDef<LineDto> {
  return {
    id: "name",
    header: t("columns.name"),
    accessorFn: (item) => item.name,
    footer: () => t("total"),
    cell: ({ row: { original } }) => (
      <span
        className={
          original.parentLineId ? "flex items-center gap-2 pl-4" : "flex items-center gap-2"
        }
      >
        {original.name}
        {original.role === "PART" || original.role === "OPTION" ? (
          <Badge variant="outline">
            {original.role === "OPTION" && original.priceEffect
              ? effects(original.priceEffect)
              : t("part")}
          </Badge>
        ) : null}
        {original.role === "ADD_ON" ? <Badge variant="outline">{t("addOn")}</Badge> : null}
        {original.warnings.map((warning) => (
          <Badge
            key={warning.id}
            variant="warning"
            title={t(`warnings.${warning.kind}`, {
              sum: warning.sum ?? 0,
              expected: warning.expected ?? 0,
            })}
          >
            <TriangleAlertIcon aria-hidden />
            {t(`warningsShort.${warning.kind}`)}
          </Badge>
        ))}
      </span>
    ),
  };
}
