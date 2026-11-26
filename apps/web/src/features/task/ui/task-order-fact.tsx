"use client";

import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { TaskLinkOrderDialog } from "./task-link-order";

export type TaskOrderFactProps = {
  taskId: string;
  currentOrderId: string | null;
  /** What the fact shows: the linked order's link, or "No order". */
  children: ReactNode;
  /** The customer's orders it may join; only with `task:write` on an open task, else null. */
  linkableOrders: Promise<readonly NamedOption[]> | null;
};

/** The Order fact: a pencil opens the order picker to add, move or remove the task's order. */
export function TaskOrderFact({
  taskId,
  currentOrderId,
  children,
  linkableOrders,
}: TaskOrderFactProps) {
  const t = useTranslations("task");
  const [open, setOpen] = useState(false);
  if (!linkableOrders) return <>{children}</>;
  return (
    <span className="group/fact inline-flex max-w-full items-center gap-1">
      <span className="min-w-0 truncate">{children}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t(currentOrderId ? "editOrder" : "addToOrder")}
        onClick={() => setOpen(true)}
        className="size-7 shrink-0 font-sans text-muted-foreground opacity-10 transition-opacity focus-visible:opacity-100 group-hover/fact:opacity-100"
      >
        <PencilIcon className="size-3.5" />
      </Button>
      <TaskLinkOrderDialog
        taskId={taskId}
        currentOrderId={currentOrderId}
        orders={linkableOrders}
        open={open}
        onOpenChange={setOpen}
      />
    </span>
  );
}
