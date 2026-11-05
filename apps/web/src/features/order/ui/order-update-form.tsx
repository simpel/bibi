"use client";

import type { OrderDto } from "@bibi/core";
import { useRouter } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { OrderForm } from "./order-form";
import type { OrderFormData } from "./order-form-data";

export type OrderUpdateFormProps = { order: OrderDto; data: OrderFormData };

/** The order form on its update page; saving (or cancelling) goes back to the order. */
export function OrderUpdateForm({ order, data }: OrderUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <OrderForm
        data={data}
        order={order}
        onDone={() => router.push(orderRoute({ id: order.id }))}
      />
    </div>
  );
}
