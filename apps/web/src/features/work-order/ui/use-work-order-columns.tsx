import { Badge, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import type { WorkOrderRow } from "../lib/work-order-rows";
import { CurrentVersionBadge } from "./current-version-badge";

type Column = ColumnDef<WorkOrderRow>;
type Translate = ReturnType<typeof useTranslations<"workOrder.list">>;

type TextInput = { id: string; header: string; pick: (row: WorkOrderRow) => string };

const text = ({ id, header, pick }: TextInput): Column => ({ id, header, accessorFn: pick });

/** The work order's name, linking to its page. */
const definitionColumn = ({ t }: { t: Translate }): Column => ({
  id: "definition",
  header: t("columns.workOrder"),
  accessorFn: (row) => row.definition,
  cell: ({ row: { original: row } }) => (
    <Link
      href={listItemRoute({ list: ROUTES.workOrders, id: row.id })}
      className="font-medium hover:underline"
    >
      {row.definition}
    </Link>
  ),
});

const ticketColumn = ({ t }: { t: Translate }): Column => ({
  id: "ticket",
  header: t("columns.ticket"),
  accessorFn: (row) => row.ticketLabel,
  cell: ({ row: { original: row } }) => (
    <Link
      href={listItemRoute({ list: ROUTES.tickets, id: row.ticketId })}
      className="hover:underline"
    >
      {row.ticketLabel}
    </Link>
  ),
});

const versionColumn = ({ t }: { t: Translate }): Column => ({
  id: "version",
  header: t("columns.version"),
  accessorFn: (row) => row.version,
  cell: ({ row: { original: row } }) => (
    <span className="flex items-center gap-2">
      <span className="tabular-nums">v{row.version}</span>
      <CurrentVersionBadge current={row.current} version={row.version} />
    </span>
  ),
});

/** Blocked, sent or not sent; the server cannot order by it. */
const statusColumn = ({ t }: { t: Translate }): Column => ({
  id: "status",
  header: t("columns.status"),
  enableSorting: false,
  cell: ({ row: { original: row } }) =>
    row.blocked ? (
      <Badge variant="destructive">{t("status.blocked")}</Badge>
    ) : (
      <Badge variant={row.sentAt ? "outline" : "default"}>
        {row.sentAt ? t("status.sent") : t("status.notSent")}
      </Badge>
    ),
});

/**
 * Work order (link), ticket (link), responsibility, when, version with its badge, status and
 * when it was sent.
 */
export function useWorkOrderColumns(): Column[] {
  const t = useTranslations("workOrder.list");
  return useMemo<Column[]>(
    () => [
      definitionColumn({ t }),
      ticketColumn({ t }),
      text({
        id: "responsibility",
        header: t("columns.responsibility"),
        pick: (row) => row.responsibility,
      }),
      text({ id: "when", header: t("columns.when"), pick: (row) => row.when }),
      versionColumn({ t }),
      statusColumn({ t }),
      text({ id: "sent", header: t("columns.sentAt"), pick: (row) => row.sentAt ?? "–" }),
    ],
    [t],
  );
}
