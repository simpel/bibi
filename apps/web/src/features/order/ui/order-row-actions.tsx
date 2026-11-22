"use client";

import type { OrderDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";

export type OrderRowActionsProps = { order: OrderDto };

/** Row actions in the orders table: Open (the order is edited in place on its page). */
export function OrderRowActions({ order }: OrderRowActionsProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const detail = orderRoute({ id: order.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[
        { label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) },
      ]}
    />
  );
}

/** Right-click context menu for an order row. */
export function OrderRowMenu({ order }: OrderRowActionsProps) {
  const common = useTranslations("common");
  return (
    <ContextMenuItem asChild>
      <Link href={orderRoute({ id: order.id })}>
        <ExternalLinkIcon />
        {common("open")}
      </Link>
    </ContextMenuItem>
  );
}
