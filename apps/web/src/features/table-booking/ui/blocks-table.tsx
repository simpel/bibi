"use client";

import {
  actionsColumn,
  Badge,
  type ColumnDef,
  ContextMenuItem,
  createTableColumns,
  DataTableRowActions,
  dateColumn,
} from "@bibi/ui";
import { UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { deleteBlockAction } from "@/features/reservation/actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import type { BlockRow } from "../lib/block-rows";

export type BlocksTableProps = { rows: readonly BlockRow[]; canEdit: boolean };

/** The room's upcoming blocks, each with a Release action. */
export function BlocksTable({ rows, canEdit }: BlocksTableProps) {
  const t = useTranslations("tableBooking.blocks");
  const block = useTranslations("reservation.block");
  const common = useTranslations("common");
  const router = useRouter();
  const [releasing, setReleasing] = useState<BlockRow | null>(null);
  const { run, pending } = useToastAction();
  const columns = useMemo<ColumnDef<BlockRow>[]>(
    () =>
      createTableColumns<BlockRow>({
        primary: [
          {
            id: "table",
            header: t("table"),
            accessorFn: (row) => row.label,
            cell: ({ row }) => (
              <span className="font-medium">{block("table", { label: row.original.label })}</span>
            ),
          },
        ],
        relations: [
          {
            id: "kind",
            header: t("kind"),
            accessorFn: (row) => row.kind,
            cell: ({ row }) => (
              <Badge variant={row.original.kind === "BLOCK" ? "destructive" : "secondary"}>
                {block(`kinds.${row.original.kind}`)}
              </Badge>
            ),
          },
          { id: "note", header: t("note"), accessorFn: (row) => row.note },
        ],
        dates: [
          dateColumn<BlockRow>({
            id: "period",
            header: t("period"),
            getSortValue: (row) => row.startsAt,
            cell: (row) => row.period,
          }),
        ],
        actions: canEdit
          ? [
              actionsColumn<BlockRow>({
                label: common("actions"),
                cell: (row) => (
                  <DataTableRowActions
                    label={common("actions")}
                    primary={[
                      {
                        label: block("release"),
                        icon: UnlockIcon,
                        onClick: () => setReleasing(row),
                      },
                    ]}
                  />
                ),
              }),
            ]
          : [],
      }),
    [t, block, common, canEdit],
  );
  const release = () => {
    if (!releasing) return;
    run({
      action: () => deleteBlockAction({ id: releasing.id }),
      messages: { pending: common("saving"), success: block("released") },
      onSuccess: () => {
        setReleasing(null);
        router.refresh();
      },
    });
  };
  return (
    <>
      <PersistedDataTable<BlockRow, unknown>
        tableId="table-booking.blocks"
        columns={columns}
        data={[...rows]}
        getRowId={(row) => row.id}
        emptyText={t("empty")}
        rowMenu={
          canEdit
            ? (row: BlockRow) => (
                <ContextMenuItem onSelect={() => setReleasing(row)}>
                  <UnlockIcon />
                  {block("release")}
                </ContextMenuItem>
              )
            : undefined
        }
      />
      <ConfirmDialog
        open={releasing !== null}
        onOpenChange={(open) => (open ? null : setReleasing(null))}
        title={block("releaseTitle", { label: releasing?.label ?? "" })}
        description={block("releaseDescription")}
        confirmLabel={block("release")}
        pending={pending}
        variant="default"
        onConfirm={release}
      />
    </>
  );
}
