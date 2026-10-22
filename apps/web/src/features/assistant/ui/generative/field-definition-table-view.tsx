"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type FieldDefinitionTableViewProps = GenerativeProps<"field-definition-table">;

type Row = FieldDefinitionTableViewProps["items"][number];

function useFieldColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.field");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (field) => field.name,
        cell: ({ row }) => (
          <Link
            href={entityTypeRoute({ id: row.original.entityTypeId })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { id: "kind", header: t("columns.kind"), accessorFn: (field) => t(`kind.${field.kind}`) },
      {
        id: "required",
        header: t("columns.required"),
        accessorFn: (field) => field.required,
        cell: ({ row }) => (row.original.required ? t("yes") : "–"),
      },
    ],
    [t],
  );
}

/** A page of fields; each name links to the type the field belongs to. */
export function FieldDefinitionTableView({ items, nextCursor }: FieldDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.field");
  const columns = useFieldColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="field-definition-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.field-definition"
        columns={columns}
        data={items}
        getRowId={(field) => field.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
