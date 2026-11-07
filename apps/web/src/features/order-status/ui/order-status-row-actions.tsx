"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveOrderStatusDialog } from "./archive-order-status-dialog";
import { MoveItems } from "./move-items";

export type OrderStatusRowActionsProps = {
  orderStatus: OrderStatusDto;
  index: number;
  statuses: readonly OrderStatusDto[];
  access: RowAccess;
};

/** The update page of one status. */
export const orderStatusEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminPipeline, id }) });

type MenuProps = OrderStatusRowActionsProps & { onArchive: () => void };

function StatusMenu({ orderStatus, index, statuses, access, onArchive }: MenuProps) {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const editHref = orderStatusEditHref({ id: orderStatus.id });
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

export type OrderStatusRowMenuProps = { orderStatus: OrderStatusDto; access: RowAccess };

/** Right-click menu for a status row: the edit page. */
export function OrderStatusRowMenu({ orderStatus, access }: OrderStatusRowMenuProps) {
  const t = useTranslations("orderStatus");
  if (!access.canEdit) return null;
  return (
    <ContextMenuItem asChild>
      <Link href={orderStatusEditHref({ id: orderStatus.id })}>{t("edit")}</Link>
    </ContextMenuItem>
  );
}
