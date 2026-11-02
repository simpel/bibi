"use client";

import type { WorkOrderDefinitionDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveWorkOrderDefinitionDialog } from "./archive-work-order-definition-dialog";

export type WorkOrderDefinitionRowActionsProps = {
  workOrder: WorkOrderDefinitionDto;
  access: RowAccess;
};

/** Edit / archive menu for one work order definition. */
export function WorkOrderDefinitionRowActions({
  workOrder,
  access,
}: WorkOrderDefinitionRowActionsProps) {
  const t = useTranslations("workOrderDefinition");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem asChild>
            <Link
              href={updateRoute({
                detail: listItemRoute({ list: ROUTES.settingsWorkOrders, id: workOrder.id }),
              })}
            >
              {t("edit")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveWorkOrderDefinitionDialog
        workOrder={workOrder}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
