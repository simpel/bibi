"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { NewOrderStatusForm } from "./new-order-status-form";
import { OrderStatusForm } from "./order-status-form";

export type OrderStatusPageFormProps = { orderStatus?: OrderStatusDto | undefined };

/** The status form on its create or update page; saving (or cancelling) goes back to the list. */
export function OrderStatusPageForm({ orderStatus }: OrderStatusPageFormProps) {
  const router = useRouter();
  const onDone = () => router.push(ROUTES.settingsPipeline);
  return (
    <div className="max-w-2xl">
      {orderStatus ? (
        <OrderStatusForm orderStatus={orderStatus} onDone={onDone} />
      ) : (
        <NewOrderStatusForm onDone={onDone} />
      )}
    </div>
  );
}
