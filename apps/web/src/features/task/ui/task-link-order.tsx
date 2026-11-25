"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Suspense, use, useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { linkTaskOrderAction } from "../actions";

export type TaskLinkOrderDialogProps = {
  taskId: string;
  /** The customer's orders it may join; read on the server, unwrapped when the dialog opens. */
  orders: Promise<readonly NamedOption[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The header's Add to order: picks one of the customer's orders, once (`task.linkOrder`). */
export function TaskLinkOrderDialog({ open, onOpenChange, ...props }: TaskLinkOrderDialogProps) {
  const t = useTranslations("task");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addToOrder")}</DialogTitle>
          <DialogDescription>{t("addToOrderDescription")}</DialogDescription>
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

function LinkOrderForm({ taskId, orders: ordersPromise, onDone }: LinkOrderFormProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const orders = use(ordersPromise);
  const [orderId, setOrderId] = useState("");
  const { run, pending } = useToastAction();
  const link = () =>
    run({
      action: () => linkTaskOrderAction({ input: { taskId, orderId } }),
      messages: { pending: common("saving"), success: t("linked") },
      onSuccess: () => {
        onDone();
        router.refresh();
      },
    });
  return (
    <div className="grid gap-4">
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOrdersToAdd")}</p>
      ) : (
        <Select value={orderId} onValueChange={setOrderId}>
          <SelectTrigger aria-label={t("fields.order")}>
            <SelectValue placeholder={common("select")} />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                {order.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("cancel")}
        </Button>
        <Button type="button" disabled={!orderId || pending} onClick={link}>
          {t("addToOrder")}
        </Button>
      </DialogFooter>
    </div>
  );
}
