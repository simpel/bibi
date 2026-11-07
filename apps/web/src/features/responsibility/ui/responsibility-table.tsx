"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
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

const NO_QUALIFIERS: TableQualifier<ResponsibilityDto>[] = [];

/** The organization's responsibilities: what each covers and who answers for it by default. */
export function ResponsibilityTable({
  responsibilities,
  options,
  access,
}: ResponsibilityTableProps) {
  const t = useTranslations("responsibility");
  const router = useRouter();
  const columns = useResponsibilityColumns({ options, access });
  const view = useClientTableView({
    rows: responsibilities,
    qualifiers: NO_QUALIFIERS,
    getSearchText: (responsibility) => responsibility.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
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
