"use client";

import { Link } from "@bibi/i18n/navigation";
import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { vocabularyRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type VocabularyTableViewProps = GenerativeProps<"vocabulary-table">;

type Row = VocabularyTableViewProps["items"][number];

function useVocabularyColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.vocabulary");
  return useMemo<ColumnDef<Row>[]>(
    () => [
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
      },
    ],
    [t],
  );
}

/** A page of lists; each name links to the list page. */
export function VocabularyTableView({ items, nextCursor }: VocabularyTableViewProps) {
  const t = useTranslations("assistant.ui.vocabulary");
  const columns = useVocabularyColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="vocabulary-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.vocabulary"
        columns={columns}
        data={items}
        getRowId={(vocabulary) => vocabulary.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
