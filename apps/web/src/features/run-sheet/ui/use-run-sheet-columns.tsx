import type { RunSheetStatus } from "@bibi/core/schemas";
import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  statusColumn as uiStatusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import type { RunSheetRow } from "../lib/run-sheet-rows";

type Column = ColumnDef<RunSheetRow>;

const STATUS_COLORS: Record<RunSheetStatus, string> = {
  DRAFT: "var(--muted-foreground)",
  BLOCKED: "var(--destructive)",
  PENDING: "var(--warning)",
  REVISION_PENDING: "var(--warning)",
  FULFILLED: "var(--success)",
};

export type UseRunSheetColumnsInput = {
  renderActions?: ((row: RunSheetRow) => ReactNode) | undefined;
};

/**
 * Run sheet (link), order (link), responsibility, status, when, published and row actions.
 */
export function useRunSheetColumns({ renderActions }: UseRunSheetColumnsInput = {}): Column[] {
  const t = useTranslations("runSheet.list");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () =>
      createTableColumns<RunSheetRow>({
        primary: [
          {
            id: "definition",
            header: t("columns.runSheet"),
            accessorFn: (row) => row.definition,
            cell: ({ row: { original: row } }) => (
              <Link
                href={listItemRoute({ list: ROUTES.runSheets, id: row.id })}
                className="font-medium hover:underline"
              >
                {row.definition}
              </Link>
            ),
          },
        ],
        relations: [
          {
            id: "order",
            header: t("columns.order"),
            accessorFn: (row) => row.orderLabel,
            cell: ({ row: { original: row } }) => (
              <Link
                href={listItemRoute({ list: ROUTES.orders, id: row.orderId })}
                onClick={(event) => event.stopPropagation()}
                className="hover:underline"
              >
                {row.orderLabel}
              </Link>
            ),
          },
          {
            id: "responsibility",
            header: t("columns.responsibility"),
            accessorFn: (row) => row.responsibility,
          },
        ],
        status: [
          uiStatusColumn<RunSheetRow>({
            header: t("columns.status"),
            getStatus: (row) => {
              const statusKey = `status.${row.status.toLowerCase()}` as Parameters<typeof t>[0];
              return { label: t(statusKey), color: STATUS_COLORS[row.status] };
            },
          }),
        ],
        dates: [
          { id: "when", header: t("columns.when"), accessorFn: (row) => row.when },
          {
            id: "published",
            header: t("columns.publishedAt"),
            accessorFn: (row) => row.publishedAt ?? "–",
          },
        ],
        actions: renderActions
          ? [actionsColumn<RunSheetRow>({ label: common("actions"), cell: renderActions })]
          : [],
      }),
    [t, common, renderActions],
  );
}
