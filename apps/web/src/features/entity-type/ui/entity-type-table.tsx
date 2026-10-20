"use client";

import type { EntityTypeDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useEntityTypeColumns } from "./use-entity-type-columns";

export type EntityTypeTableProps = { types: EntityTypeDto[] };

/** Types of one base entity: name (link to the detail page), capabilities and field count. */
export function EntityTypeTable({ types }: EntityTypeTableProps) {
  const t = useTranslations("entityType");
  const columns = useEntityTypeColumns();
  return (
    <PersistedDataTable
      tableId="entity-type.list"
      columns={columns}
      data={types}
      getRowId={(type) => type.id}
      emptyText={t("empty")}
    />
  );
}
