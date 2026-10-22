"use client";

import { Link } from "@bibi/i18n/navigation";
import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { entityTypeRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type EntityTypeTableViewProps = GenerativeProps<"entity-type-table">;

type Row = EntityTypeTableViewProps["items"][number];

function useEntityTypeColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.entityType");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (type) => type.name,
        cell: ({ row }) => (
          <Link
            href={entityTypeRoute({ id: row.original.id })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { id: "base", header: t("columns.base"), accessorFn: (type) => t(`base.${type.base}`) },
      {
        id: "capabilities",
        header: t("columns.capabilities"),
        accessorFn: (type) =>
          type.capabilities.map((capability) => t(`capability.${capability}`)).join(", ") || "–",
      },
      { id: "fields", header: t("columns.fields"), accessorFn: (type) => type.fields.length },
    ],
    [t],
  );
}

/** A page of types; each name links to the type's settings page. */
export function EntityTypeTableView({ items, nextCursor }: EntityTypeTableViewProps) {
  const t = useTranslations("assistant.ui.entityType");
  const columns = useEntityTypeColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="entity-type-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.entity-type"
        columns={columns}
        data={items}
        getRowId={(type) => type.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
