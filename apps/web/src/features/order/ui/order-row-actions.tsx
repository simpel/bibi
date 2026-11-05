"use client";

import type { OrderDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { orderRoute, updateRoute } from "@/lib/routes";

export type OrderRowActionsProps = {
  order: OrderDto;
  canEdit?: boolean | undefined;
};

/** Row actions in the orders table: Edit (when allowed) or Open. */
export function OrderRowActions({ order, canEdit = false }: OrderRowActionsProps) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const detail = orderRoute({ id: order.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        canEdit
          ? [
              {
                label: t("edit"),
                icon: PencilIcon,
                onClick: () => router.push(updateRoute({ detail })),
              },
            ]
          : [
              {
                label: common("open"),
                icon: ExternalLinkIcon,
                onClick: () => router.push(detail),
              },
            ]
      }
    />
  );
}

/** Right-click context menu for an order row. */
export function OrderRowMenu({ order, canEdit = false }: OrderRowActionsProps) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const detail = orderRoute({ id: order.id });
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={detail}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      {canEdit ? (
        <ContextMenuItem asChild>
          <Link href={updateRoute({ detail })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </ContextMenuItem>
      ) : null}
    </>
  );
}
