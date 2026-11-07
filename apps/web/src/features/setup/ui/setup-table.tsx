"use client";

import type { SetupDto } from "@bibi/core";
import { ContextMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { SetupDialog } from "./setup-dialog";
import { useSetupColumns } from "./use-setup-columns";

export type SetupTableProps = { setups: SetupDto[]; access: RowAccess };

/** Setups of the organization with their changeover time; a row opens its edit dialog. */
export function SetupTable({ setups, access }: SetupTableProps) {
  const t = useTranslations("setup");
  const [editing, setEditing] = useState<SetupDto | null>(null);
  const columns = useSetupColumns({ access });
  const qualifiers = useMemo<TableQualifier<SetupDto>[]>(() => {
    const minutes = Array.from(
      new Set(
        setups
          .map((setup) => setup.changeoverMinutes)
          .sort((a, b) => a - b)
          .map((value) => t("changeoverValue", { minutes: value })),
      ),
    );
    return [
      {
        key: "changeover",
        label: t("columns.changeover"),
        hint: minutes.slice(0, 3).join(", "),
        pick: (setup) => t("changeoverValue", { minutes: setup.changeoverMinutes }),
        options: minutes,
      },
    ];
  }, [setups, t]);
  const view = useClientTableView({
    rows: setups,
    qualifiers,
    getSearchText: (setup) =>
      `${setup.name} ${t("changeoverValue", { minutes: setup.changeoverMinutes })}`,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="setup.list"
        columns={columns}
        data={view.rows}
        getRowId={(setup) => setup.id}
        onRowClick={access.canEdit ? (setup) => setEditing(setup) : undefined}
        rowMenu={
          access.canEdit
            ? (setup) => (
                <ContextMenuItem onSelect={() => setEditing(setup)}>
                  <PencilIcon />
                  {t("edit")}
                </ContextMenuItem>
              )
            : undefined
        }
        emptyText={t("empty")}
        pagination={view.pagination}
      />
      <SetupDialog
        key={editing?.id}
        setup={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
