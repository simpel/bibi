import type { VocabularyDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { vocabularyRoute } from "@/lib/configuration-routes";
import { VocabularyRowActions } from "./vocabulary-row-actions";

type Column = ColumnDef<VocabularyDto>;

/** Name (link) · value count, plus the row actions when the caller can write. */
export function useVocabularyColumns({ access }: { access: RowAccess }): Column[] {
  const t = useTranslations("vocabulary");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (vocabulary) => vocabulary.name,
        cell: ({ row }) => (
          <Link
            href={vocabularyRoute({ id: row.original.id })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "values",
        header: t("columns.values"),
        accessorFn: (vocabulary) => vocabulary.values.length,
        cell: ({ row }) => t("valueCount", { count: row.original.values.length }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<VocabularyDto>({
        label: common("actions"),
        cell: (vocabulary) => <VocabularyRowActions vocabulary={vocabulary} access={access} />,
      }),
    ];
  }, [t, common, access]);
}
