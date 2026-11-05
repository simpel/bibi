import type { OrderStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type OrderStatusEdit,
  type OrderStatusFormValues,
  orderStatusFormDefaults,
  orderStatusFormSchema,
} from "./order-status-form-schema";

export type UseOrderStatusFormInput = { orderStatus: OrderStatusDto };

/** The status edit form, wired to core's update schema with localized validation messages. */
export function useOrderStatusForm({ orderStatus }: UseOrderStatusFormInput) {
  return useForm<OrderStatusFormValues, unknown, OrderStatusEdit>({
    resolver: zodResolver(orderStatusFormSchema, useZodMessages()),
    defaultValues: orderStatusFormDefaults({ orderStatus }),
  });
}
