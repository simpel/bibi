"use client";

import {
  actionsColumn,
  type ColumnDef,
  ContextMenuItem,
  createTableColumns,
  DataTableRowActions,
} from "@bibi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveSittingAction } from "../actions";
import type { LayoutOption, SittingRow } from "../lib/sitting-row";
import { SittingSheet } from "./sitting-sheet";

export type SittingTableProps = {
  roomItemId: string;
  rows: readonly SittingRow[];
  layouts: readonly LayoutOption[];
  access: RowAccess;
};

type RowActionsProps = {
  row: SittingRow;
  access: RowAccess;
  onEdit: (row: SittingRow) => void;
  onArchive: (row: SittingRow) => void;
};

function RowActions({ row, access, onEdit, onArchive }: RowActionsProps) {
  const t = useTranslations("tableBooking.sittings");
  const common = useTranslations("common");
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[
        ...(access.canEdit
          ? [{ label: t("edit"), icon: PencilIcon, onClick: () => onEdit(row) }]
          : []),
        ...(access.canRemove
          ? [
              {
                label: t("archive"),
                icon: ArchiveIcon,
                onClick: () => onArchive(row),
                destructive: true,
              },
            ]
          : []),
      ]}
    />
  );
}

/** The room's sittings: Edit opens the sheet, Archive asks first. */
export function SittingTable({ roomItemId, rows, layouts, access }: SittingTableProps) {
  const t = useTranslations("tableBooking.sittings");
  const common = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<SittingRow | null>(null);
  const [archiving, setArchiving] = useState<SittingRow | null>(null);
  const { run, pending } = useToastAction();
  const columns = useMemo<ColumnDef<SittingRow>[]>(
    () =>
      createTableColumns<SittingRow>({
        primary: [
          {
            id: "name",
            header: t("name"),
            accessorFn: (row) => row.name,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
          },
        ],
        relations: [
          { id: "weekdays", header: t("weekdays"), accessorFn: (row) => row.weekdaysLabel },
          { id: "starts", header: t("starts"), accessorFn: (row) => row.startsLabel },
          { id: "layout", header: t("layout"), accessorFn: (row) => row.layoutName },
          { id: "season", header: t("season"), accessorFn: (row) => row.season },
        ],
        numbers: [{ id: "covers", header: t("covers"), accessorFn: (row) => row.covers }],
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<SittingRow>({
                  label: common("actions"),
                  cell: (row) => (
                    <RowActions
                      row={row}
                      access={access}
                      onEdit={setEditing}
                      onArchive={setArchiving}
                    />
                  ),
                }),
              ]
            : [],
      }),
    [t, common, access],
  );
  const archive = () => {
    if (!archiving) return;
    run({
      action: () => archiveSittingAction({ id: archiving.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        setArchiving(null);
        router.refresh();
      },
    });
  };
  return (
    <>
      <ClientDataTable
        tableId="table-booking.sittings"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        getSearchText={(row) => `${row.name} ${row.layoutName}`}
        {...(access.canEdit ? { onRowClick: (row: SittingRow) => setEditing(row) } : {})}
        rowMenu={(row) => (
          <>
            {access.canEdit ? (
              <ContextMenuItem onSelect={() => setEditing(row)}>
                <PencilIcon />
                {t("edit")}
              </ContextMenuItem>
            ) : null}
            {access.canRemove ? (
              <ContextMenuItem destructive onSelect={() => setArchiving(row)}>
                <ArchiveIcon />
                {t("archive")}
              </ContextMenuItem>
            ) : null}
          </>
        )}
        emptyText={t("empty")}
      />
      <SittingSheet
        roomItemId={roomItemId}
        layouts={layouts}
        sitting={editing ? { id: editing.id, values: editing.values } : undefined}
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
      />
      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(open) => (open ? null : setArchiving(null))}
        title={t("archiveTitle", { name: archiving?.name ?? "" })}
        description={t("archiveDescription")}
        confirmLabel={t("archive")}
        pending={pending}
        onConfirm={archive}
      />
    </>
  );
}
