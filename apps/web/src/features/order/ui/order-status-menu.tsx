"use client";

import type { OrderDto, OrderStatusDto } from "@bibi/core";
import {
  Button,
  ColorSwatch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChangeStatusDialog } from "./change-status-dialog";
import { OrderStatusLabel } from "./order-status-label";

export type OrderStatusMenuProps = {
  order: OrderDto;
  statuses: readonly OrderStatusDto[];
};

/** The statuses the organization allows from the order's current one, in board order. */
const statusTargets = ({ order, statuses }: OrderStatusMenuProps): OrderStatusDto[] => {
  const current = statuses.find(({ id }) => id === order.statusId);
  const allowed = new Set(current?.closes ? [] : (current?.transitionsTo ?? []));
  return statuses.filter(({ id }) => allowed.has(id));
};

/**
 * The order's status as a dropdown: picking a target opens the change-status dialog with it
 * chosen (reason and gates). A plain label when no transition leaves the current status.
 */
export function OrderStatusMenu({ order, statuses }: OrderStatusMenuProps) {
  const t = useTranslations("order");
  const [target, setTarget] = useState<string | null>(null);
  const targets = statusTargets({ order, statuses });
  const label = <OrderStatusLabel statuses={statuses} id={order.statusId} />;
  if (targets.length === 0) return label;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label={t("changeStatus")}>
            {label}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("changeStatus")}</DropdownMenuLabel>
          {targets.map((status) => (
            <DropdownMenuItem key={status.id} onSelect={() => setTarget(status.id)}>
              <ColorSwatch color={status.color} />
              {status.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangeStatusDialog
        order={order}
        targets={targets.map(({ id, name }) => ({ id, name }))}
        statusId={target ?? ""}
        open={target !== null}
        onOpenChange={(open) => (open ? null : setTarget(null))}
      />
    </>
  );
}
