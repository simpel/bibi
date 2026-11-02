"use client";

import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { WorkOrderNeedRow, WorkOrderTaskRow } from "../document-rows";
import { useWorkOrderNeedColumns } from "./use-work-order-need-columns";
import { useWorkOrderTaskColumns, type WorkOrderFieldColumn } from "./use-work-order-task-columns";

export type WorkOrderTaskTableProps = {
  tasks: WorkOrderTaskRow[];
  fields: readonly WorkOrderFieldColumn[];
};

/** What to deliver: one row per line on the work order, in time order. */
export function WorkOrderTaskTable({ tasks, fields }: WorkOrderTaskTableProps) {
  const t = useTranslations("workOrder.document");
  const columns = useWorkOrderTaskColumns({ fields });
  return (
    <PersistedDataTable
      tableId="work-order.tasks"
      columns={columns}
      data={tasks}
      getRowId={(row) => row.key}
      emptyText={t("noTasks")}
    />
  );
}

export type WorkOrderNeedTableProps = { needs: WorkOrderNeedRow[] };

/** The counted needs the work order includes, e.g. allergens. */
export function WorkOrderNeedTable({ needs }: WorkOrderNeedTableProps) {
  const t = useTranslations("workOrder.document");
  const columns = useWorkOrderNeedColumns();
  return (
    <PersistedDataTable
      tableId="work-order.needs"
      columns={columns}
      data={needs}
      getRowId={(row) => row.key}
      emptyText={t("noNeeds")}
    />
  );
}
