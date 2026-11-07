"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { ContextMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { Link, useRouter } from "@/lib/navigation";
import { orderStatusEditHref } from "./order-status-row-actions";
import { useStatusFlowColumns } from "./status-flow-columns";
import { toStatusRows } from "./status-rows";
import { useStatusFlowQualifiers } from "./use-status-flow-qualifiers";

export type StatusFlowTableProps = { statuses: readonly OrderStatusDto[] };

/** The flow rules per status (ADR 0076, `pipeline:write`); a row opens the status's rules page. */
export function StatusFlowTable({ statuses }: StatusFlowTableProps) {
  const t = useTranslations("orderStatus");
  const router = useRouter();
  const columns = useStatusFlowColumns({ statuses });
  const rows = useMemo(() => toStatusRows({ statuses }), [statuses]);
  const qualifiers = useStatusFlowQualifiers({ statuses });
  const view = useClientTableView({
    rows,
    qualifiers,
    getSearchText: (row) => row.orderStatus.name,
    totalLabel: (count) => `${count}`,
    scope: "flow",
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} keys={view.keys} />
      <PersistedDataTable
        tableId="order-status.flow"
        columns={columns}
        data={view.rows}
        getRowId={(row) => row.orderStatus.id}
        onRowClick={(row) => router.push(orderStatusEditHref({ id: row.orderStatus.id }))}
        rowMenu={(row) => (
          <ContextMenuItem asChild>
            <Link href={orderStatusEditHref({ id: row.orderStatus.id })}>
              <PencilIcon />
              {t("flow.editRules")}
            </Link>
          </ContextMenuItem>
        )}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
