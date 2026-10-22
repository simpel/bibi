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
    cell: ({ row: { original } }) =>
      original.parentLineId ? (
        <span className="flex items-center gap-2 pl-4">
          {original.name}
          <Badge variant="outline">
            {original.priceEffect ? effects(original.priceEffect) : t("part")}
          </Badge>
        </span>
      ) : (
        original.name
      ),
  };
}
