"use client";

import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuickFilterPill, TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { entityTypeRoute } from "@/lib/configuration-routes";
import { useRouter } from "@/lib/navigation";
import { EntityTypeRowActions, EntityTypeRowMenu } from "./entity-type-row-actions";
import { useEntityTypeColumns } from "./use-entity-type-columns";

export type EntityTypeTableProps = { types: EntityTypeDto[]; access?: RowAccess | undefined };

function useEntityTypeQualifiers({
  types,
}: {
  types: EntityTypeDto[];
}): TableQualifier<EntityTypeDto>[] {
  const t = useTranslations("entityType");
  const bases = useMemo(
    () => Array.from(new Set(types.map((type) => t(`bases.${type.base}`)))),
    [types, t],
  );
  const capabilities = useMemo(
    () =>
      Array.from(
        new Set(types.flatMap((type) => type.capabilities.map((c) => t(`capabilities.${c}`)))),
      ),
    [types, t],
  );
  return useMemo(
    () => [
      {
        key: "base",
        label: t("fields.base"),
        hint: bases.join(", ") || t("fields.base"),
        pick: (type) => t(`bases.${type.base}`),
        options: bases,
      },
      {
        key: "capability",
        label: t("columns.capabilities"),
        hint: t("columns.capabilities"),
        pick: (type) => type.capabilities.map((c) => t(`capabilities.${c}`)),
        options: capabilities,
      },
    ],
    [t, bases, capabilities],
  );
}

/** Unified entity types table: name, base (Applies to), capabilities, field count and actions. */
export function EntityTypeTable({
  types,
  access = { canEdit: false, canRemove: false },
}: EntityTypeTableProps) {
  const t = useTranslations("entityType");
  const common = useTranslations("common");
  const router = useRouter();
  const qualifiers = useEntityTypeQualifiers({ types });
  const view = useClientTableView({
    rows: types,
    qualifiers,
    getSearchText: (type) => `${type.name} ${t(`bases.${type.base}`)}`,
    totalLabel: (count) => `${count}`,
  });
  const baseValues = Array.from(new Set(types.map((type) => type.base)));
  const pills: QuickFilterPill[] = [
    { key: "all", label: common("readFilter.all"), query: undefined },
    ...baseValues.map((base) => {
      const label = t(`bases.${base}`);
      return { key: base, label, query: label.includes(" ") ? `base:"${label}"` : `base:${label}` };
    }),
  ];
  const columns = useEntityTypeColumns({
    renderActions: (entityType) => <EntityTypeRowActions entityType={entityType} access={access} />,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar
        q={view.q}
        query={view.query}
        pills={pills}
        onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
      />
      <PersistedDataTable
        tableId="entity-type.list"
        columns={columns}
        data={view.rows}
        getRowId={(type) => type.id}
        onRowClick={(type) => router.push(entityTypeRoute({ id: type.id }))}
        rowMenu={(entityType) => <EntityTypeRowMenu entityType={entityType} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
