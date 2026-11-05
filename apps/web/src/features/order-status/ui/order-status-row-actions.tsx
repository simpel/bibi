"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveOrderStatusDialog } from "./archive-order-status-dialog";
import { MoveItems } from "./move-items";

export type OrderStatusRowActionsProps = {
  orderStatus: OrderStatusDto;
  index: number;
  statuses: readonly OrderStatusDto[];
  access: RowAccess;
};

type MenuProps = OrderStatusRowActionsProps & { onArchive: () => void };

function StatusMenu({ orderStatus, index, statuses, access, onArchive }: MenuProps) {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const editHref = updateRoute({
    detail: listItemRoute({ list: ROUTES.settingsPipeline, id: orderStatus.id }),
  });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        access.canEdit
          ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
          : []
      }
    >
      {access.canEdit ? <MoveItems statuses={statuses} index={index} /> : null}
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={onArchive}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Edit (page) / move / archive for one status; the flow has its own editor (ADR 0076). */
export function OrderStatusRowActions(props: OrderStatusRowActionsProps) {
  const { orderStatus, statuses } = props;
  const [archiveOpen, setArchiveOpen] = useState(false);
  return (
    <>
      <StatusMenu {...props} onArchive={() => setArchiveOpen(true)} />
      <ArchiveOrderStatusDialog
        orderStatus={orderStatus}
        statuses={statuses}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
    </>
  );
}
