"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type WorkOrderTableViewProps = GenerativeProps<"work-order-table">;

type Row = WorkOrderTableViewProps["items"][number];

function useWorkOrderColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.workOrder");
  const format = useDateTimeFormat();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "version",
        header: t("columns.version"),
        accessorFn: (workOrder) => workOrder.version,
        cell: ({ row }) => (
          <Link
            href={ticketRoute({ id: row.original.ticketId })}
            className="font-medium hover:underline"
          >
            {t("version", { version: row.original.version })}
          </Link>
        ),
      },
      {
        id: "changes",
        header: t("columns.changes"),
        accessorFn: (workOrder) => workOrder.changes.length,
        cell: ({ row }) =>
          row.original.changes.length > 0 ? `★ ${row.original.changes.length}` : "–",
      },
      {
        id: "sent",
        header: t("columns.sent"),
        accessorFn: (workOrder) => (workOrder.sentAt ? new Date(workOrder.sentAt) : undefined),
        cell: ({ row }) =>
          row.original.sentAt ? format.date({ instant: row.original.sentAt }) : t("notSent"),
      },
    ],
    [t, format],
  );
}

/** A page of work order versions; each row links to its ticket's page. */
export function WorkOrderTableView({ items, nextCursor }: WorkOrderTableViewProps) {
  const t = useTranslations("assistant.ui.workOrder");
  const columns = useWorkOrderColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="work-order-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.workOrder"
        columns={columns}
        data={items}
        getRowId={(workOrder) => workOrder.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
