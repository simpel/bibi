import type { LineDto } from "@bibi/core";
import { Badge, type ColumnDef } from "@bibi/ui";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"line">>;
type EffectTranslator = ReturnType<typeof useTranslations<"priceEffect">>;

export type NameColumnInput = { t: Translator; effects: EffectTranslator };

/**
 * The line's name. A part or option line (ADR 0059) is indented and marked: a part with "Part"
 * (its bundle line carries the price), an option with its price effect.
 */
export function nameColumn({ t, effects }: NameColumnInput): ColumnDef<LineDto> {
  return {
    id: "name",
    header: t("columns.name"),
    accessorFn: (item) => item.name,
    cell: ({ row: { original } }) => (
      <span
        className={
          original.parentLineId ? "flex items-center gap-2 pl-4" : "flex items-center gap-2"
        }
      >
        {original.name}
        {original.parentLineId ? (
          <Badge variant="outline">
            {original.priceEffect ? effects(original.priceEffect) : t("part")}
          </Badge>
        ) : null}
        {original.warnings.map((warning) => (
          <Badge key={warning.id} variant="warning">
            {t(`warnings.${warning.kind}`)}
          </Badge>
        ))}
      </span>
    ),
  };
}
