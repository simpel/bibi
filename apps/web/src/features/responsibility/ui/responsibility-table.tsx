"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { qualifierPills } from "@/components/data-table/qualifier-pills";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { namesOf } from "@/features/run-sheet-definition/ui/run-sheet-options";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import type { ResponsibilityOptions } from "./responsibility-options";
import { ResponsibilityRowMenu, responsibilityEditHref } from "./responsibility-row-actions";
import { useResponsibilityColumns } from "./use-responsibility-columns";

export type ResponsibilityTableProps = {
  responsibilities: ResponsibilityDto[];
  options: ResponsibilityOptions;
  access: RowAccess;
};

function useResponsibilityQualifiers({ options }: { options: ResponsibilityOptions }) {
  const t = useTranslations("responsibility.columns");
  return useMemo<TableQualifier<ResponsibilityDto>[]>(() => {
    const people = options.people.map((person) => person.name);
    const named = ({ ids }: { ids: readonly string[] }) =>
      namesOf({ ids, options: options.people });
    return [
      {
        key: "type",
        label: t("types"),
        hint: options.types.map((type) => type.name).join(", "),
        pick: (r) => namesOf({ ids: r.entityTypeIds, options: options.types }),
        options: options.types.map((type) => type.name),
      },
      {
        key: "assignee",
        label: t("assignee"),
        hint: people.join(", "),
        pick: (r) => named({ ids: [r.defaultAssigneeId] }),
        options: people,
      },
      {
        key: "follower",
        label: t("followers"),
        hint: people.join(", "),
        pick: (r) => named({ ids: r.defaultFollowerIds }),
        options: people,
      },
    ];
  }, [t, options]);
}

/** The organization's responsibilities: what each covers and who answers for it by default. */
export function ResponsibilityTable({
  responsibilities,
  options,
  access,
}: ResponsibilityTableProps) {
  const t = useTranslations("responsibility");
  const common = useTranslations("common");
  const router = useRouter();
  const columns = useResponsibilityColumns({ options, access });
  const qualifiers = useResponsibilityQualifiers({ options });
  const view = useClientTableView({
    rows: responsibilities,
    qualifiers,
    getSearchText: (responsibility) => responsibility.name,
    totalLabel: (count) => `${count}`,
  });
  const pills = qualifierPills({
    allLabel: common("readFilter.all"),
    qualifier: "type",
    values: options.types.map((type) => ({ key: type.id, label: type.name })),
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
        tableId="responsibility.list"
        columns={columns}
        data={view.rows}
        getRowId={(responsibility) => responsibility.id}
        {...(access.canEdit
          ? {
              onRowClick: (responsibility: ResponsibilityDto) =>
                router.push(responsibilityEditHref({ id: responsibility.id })),
            }
          : {})}
        rowMenu={(responsibility) => (
          <ResponsibilityRowMenu responsibility={responsibility} access={access} />
        )}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
