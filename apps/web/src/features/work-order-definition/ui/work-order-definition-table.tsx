"use client";

import type { WorkOrderDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useWorkOrderDefinitionColumns } from "./use-work-order-definition-columns";
import type { WorkOrderOptions } from "./work-order-options";

export type WorkOrderDefinitionTableProps = {
  workOrders: WorkOrderDefinitionDto[];
  options: WorkOrderOptions;
  access: RowAccess;
};

/** The organization's work orders: what each includes and which role it goes to. */
export function WorkOrderDefinitionTable({
  workOrders,
  options,
  access,
}: WorkOrderDefinitionTableProps) {
  const t = useTranslations("workOrderDefinition");
  const columns = useWorkOrderDefinitionColumns({ options, access });
  return (
    <PersistedDataTable
      tableId="work-order-definition.list"
      columns={columns}
      data={workOrders}
      getRowId={(workOrder) => workOrder.id}
      emptyText={t("empty")}
    />
  );
}
