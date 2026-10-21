import type { LineDto } from "@okazi/core";
import { Badge, type ColumnDef } from "@okazi/ui";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations<"line">>;

export type NameColumnInput = { t: Translator };

/** The line's name; a part line (ADR 0059) is indented and marked, its bundle line carries the price. */
export function nameColumn({ t }: NameColumnInput): ColumnDef<LineDto> {
  return {
    id: "name",
    header: t("columns.name"),
    accessorFn: (item) => item.name,
    cell: ({ row: { original } }) =>
      original.parentLineId ? (
        <span className="flex items-center gap-2 pl-4">
          {original.name}
          <Badge variant="outline">{t("part")}</Badge>
        </span>
      ) : (
        original.name
      ),
  };
}
