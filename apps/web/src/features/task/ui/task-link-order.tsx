"use client";

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, use, useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { Link, useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { linkTaskOrderAction, updateTaskAction } from "../actions";

export type TaskLinkOrderDialogProps = {
  taskId: string;
  /** The order it is in now: the dialog then edits it (move or remove) instead of adding. */
  currentOrderId?: string | null;
  /** The customer's orders it may join; read on the server, unwrapped when the dialog opens. */
  orders: Promise<readonly NamedOption[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The header's Add to order: type to find one of the customer's orders, then add the task to it,
 * once (`task.linkOrder`). Nothing found offers Create order from the task instead.
 */
export function TaskLinkOrderDialog({ open, onOpenChange, ...props }: TaskLinkOrderDialogProps) {
  const t = useTranslations("task");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(props.currentOrderId ? "editOrder" : "addToOrder")}</DialogTitle>
          <DialogDescription>
            {t(props.currentOrderId ? "editOrderDescription" : "addToOrderDescription")}
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={null}>
          <LinkOrderForm {...props} onDone={() => onOpenChange(false)} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

type LinkOrderFormProps = Omit<TaskLinkOrderDialogProps, "open" | "onOpenChange"> & {
  onDone: () => void;
};

function LinkOrderForm({
  taskId,
  currentOrderId = null,
  orders: ordersPromise,
  onDone,
}: LinkOrderFormProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const orders = use(ordersPromise);
  const [orderId, setOrderId] = useState(currentOrderId ?? "");
  const { run, pending } = useToastAction();
  const save = ({ next }: { next: string | null }) =>
    run({
      // The first link is `task.linkOrder`; moving or removing it is `task.update`.
      action: () =>
        currentOrderId || next === null
          ? updateTaskAction({ input: { id: taskId, orderId: next } })
          : linkTaskOrderAction({ input: { taskId, orderId: next } }),
      messages: { pending: common("saving"), success: currentOrderId ? t("updated") : t("linked") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  const createHref = `${ROUTES.orderNew}?fromTask=${encodeURIComponent(taskId)}`;
  return (
    <div className="grid gap-4">
      <Command className="rounded-md border">
        <CommandInput placeholder={t("findOrder")} autoFocus />
        <CommandList className="max-h-64">
          <CommandEmpty className="grid justify-items-start gap-2 px-3 py-3 text-sm">
            <span className="text-muted-foreground">{t("noOrderFound")}</span>
            <Button asChild size="sm" variant="outline">
              <Link href={createHref}>
                <PlusIcon aria-hidden />
                {t("createOrder")}
              </Link>
            </Button>
          </CommandEmpty>
          <CommandGroup>
            {orders.map((order) => (
              <CommandItem
                key={order.id}
                value={`${order.name} ${order.id}`}
                onSelect={() => setOrderId(order.id)}
              >
                <CheckIcon
                  aria-hidden
                  className={cn(order.id === orderId ? "opacity-100" : "opacity-0")}
                />
                {order.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("cancel")}
        </Button>
        {currentOrderId ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => save({ next: null })}
          >
            {t("removeFromOrder")}
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={!orderId || orderId === currentOrderId || pending}
          onClick={() => save({ next: orderId })}
        >
          {common("save")}
        </Button>
      </DialogFooter>
    </div>
  );
}
