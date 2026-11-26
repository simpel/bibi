"use client";

import {
  actionsColumn,
  type ColumnDef,
  ContextMenuItem,
  createTableColumns,
  DataTableRowActions,
  dateColumn,
} from "@bibi/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { deleteExceptionAction } from "../actions";
import type { ExceptionRow } from "../lib/exception-form";
import type { LayoutOption } from "../lib/sitting-row";
import { ExceptionDialog, type SittingOption } from "./exception-dialog";

export type ExceptionsTableProps = {
  rows: readonly ExceptionRow[];
  sittings: readonly SittingOption[];
  layouts: readonly LayoutOption[];
  access: RowAccess;
};

/** Upcoming exceptions of every sitting, with Edit and Delete. */
export function ExceptionsTable({ rows, sittings, layouts, access }: ExceptionsTableProps) {
  const t = useTranslations("tableBooking.exceptions");
  const common = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<ExceptionRow | null>(null);
  const [deleting, setDeleting] = useState<ExceptionRow | null>(null);
  const { run, pending } = useToastAction();
  const columns = useMemo<ColumnDef<ExceptionRow>[]>(
    () =>
      createTableColumns<ExceptionRow>({
        primary: [
          {
            id: "sitting",
            header: t("sitting"),
            accessorFn: (row) => row.serviceName,
            cell: ({ row }) => <span className="font-medium">{row.original.serviceName}</span>,
          },
        ],
        relations: [{ id: "change", header: t("change"), accessorFn: (row) => row.summary }],
        dates: [
          dateColumn<ExceptionRow>({
            id: "date",
            header: t("date"),
            getSortValue: (row) => row.date,
            cell: (row) => row.dateLabel,
          }),
        ],
        actions: access.canEdit
          ? [
              actionsColumn<ExceptionRow>({
                label: common("actions"),
                cell: (row) => (
                  <DataTableRowActions
                    label={common("actions")}
                    primary={[
                      { label: t("edit"), icon: PencilIcon, onClick: () => setEditing(row) },
                      {
                        label: t("delete"),
                        icon: Trash2Icon,
                        onClick: () => setDeleting(row),
                        destructive: true,
                      },
                    ]}
                  />
                ),
              }),
            ]
          : [],
      }),
    [t, common, access.canEdit],
  );
  const remove = () => {
    if (!deleting) return;
    run({
      action: () => deleteExceptionAction({ serviceId: deleting.serviceId, date: deleting.date }),
      messages: { pending: common("deleting"), success: t("deleted") },
      onSuccess: () => {
        setDeleting(null);
        router.refresh();
      },
    });
  };
  return (
    <>
      <PersistedDataTable
        tableId="table-booking.exceptions"
        columns={columns}
        data={[...rows]}
        getRowId={(row) => `${row.serviceId}-${row.date}`}
        rowMenu={(row) =>
          access.canEdit ? (
            <>
              <ContextMenuItem onSelect={() => setEditing(row)}>
                <PencilIcon />
                {t("edit")}
              </ContextMenuItem>
              <ContextMenuItem destructive onSelect={() => setDeleting(row)}>
                <Trash2Icon />
                {t("delete")}
              </ContextMenuItem>
            </>
          ) : null
        }
        emptyText={t("empty")}
      />
      <ExceptionDialog
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        sittings={sittings}
        layouts={layouts}
        editing={editing?.values}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title={t("deleteTitle", { date: deleting?.dateLabel ?? "" })}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
