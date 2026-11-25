"use client";

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { linkTaskOrderAction } from "../actions";

export type TaskLinkOrderProps = { taskId: string; orders: readonly NamedOption[] };

/** Adds an unlinked task to one of its customer's orders, once (`task.linkOrder`). */
export function TaskLinkOrder({ taskId, orders }: TaskLinkOrderProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const { run, pending } = useToastAction();
  const link = () =>
    run({
      action: () => linkTaskOrderAction({ input: { taskId, orderId } }),
      messages: { pending: common("saving"), success: t("linked") },
      onSuccess: () => router.refresh(),
    });
  return (
    <section className="grid gap-3">
      <h2 className="text-xl">{t("addToOrder")}</h2>
      <p className="text-sm text-muted-foreground">{t("addToOrderDescription")}</p>
      <div className="flex max-w-xl gap-2">
        <Select value={orderId} onValueChange={setOrderId}>
          <SelectTrigger aria-label={t("fields.order")} className="min-w-0 flex-1">
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
        <Button type="button" variant="outline" disabled={!orderId || pending} onClick={link}>
          {t("addToOrder")}
        </Button>
      </div>
    </section>
  );
}
