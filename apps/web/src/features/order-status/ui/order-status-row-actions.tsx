"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
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

/** Edit (page) / move for one status; archived on its page, flow in its own editor (ADR 0076). */
export function OrderStatusRowActions({
  orderStatus,
  index,
  statuses,
  access,
}: OrderStatusRowActionsProps) {
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
    </DataTableRowActions>
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
