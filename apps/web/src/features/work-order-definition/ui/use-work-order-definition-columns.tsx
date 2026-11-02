import type { WorkOrderDefinitionDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { WorkOrderDefinitionRowActions } from "./work-order-definition-row-actions";
import { namesOf, type WorkOrderOptions } from "./work-order-options";

type Column = ColumnDef<WorkOrderDefinitionDto>;

export type UseWorkOrderDefinitionColumnsInput = { options: WorkOrderOptions; access: RowAccess };

type NamesInput = { ids: readonly string[]; options: WorkOrderOptions[keyof WorkOrderOptions] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

/** Name · types · lists · role, plus the row actions when the caller can write. */
export function useWorkOrderDefinitionColumns({
  options,
  access,
}: UseWorkOrderDefinitionColumnsInput): Column[] {
  const t = useTranslations("workOrderDefinition");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (workOrder) => workOrder.name },
      {
        id: "types",
        header: t("columns.types"),
        accessorFn: (workOrder) => names({ ids: workOrder.entityTypeIds, options: options.types }),
      },
      {
        id: "lists",
        header: t("columns.lists"),
        accessorFn: (workOrder) => names({ ids: workOrder.vocabularyIds, options: options.lists }),
      },
      {
        id: "responsibility",
        header: t("columns.responsibility"),
        accessorFn: (workOrder) =>
          names({ ids: [workOrder.responsibilityId], options: options.responsibilities }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<WorkOrderDefinitionDto>({
        label: common("actions"),
        cell: (workOrder) => (
          <WorkOrderDefinitionRowActions workOrder={workOrder} access={access} />
        ),
      }),
    ];
  }, [t, common, options, access]);
}
