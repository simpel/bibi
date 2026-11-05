import type { OrderStatusCreateInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  NEW_ORDER_STATUS_DEFAULTS,
  type NewOrderStatusFormValues,
  newOrderStatusFormSchema,
} from "./new-order-status-form-schema";

/** A new status's form (name and colour), wired to core's create schema. */
export function useNewOrderStatusForm() {
  return useForm<NewOrderStatusFormValues, unknown, OrderStatusCreateInput>({
    resolver: zodResolver(newOrderStatusFormSchema, useZodMessages()),
    defaultValues: NEW_ORDER_STATUS_DEFAULTS,
  });
}
