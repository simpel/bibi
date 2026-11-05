import { OrderChangeStatusInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the change-status form; an empty reason is not sent. */
export type ChangeStatusFormValues = { statusId: string; reason: string };

export type ChangeStatusFormOutput = z.infer<typeof OrderChangeStatusInputSchema>;

/** Core's `order.changeStatus` schema for one order. */
export const changeStatusFormSchema = ({ orderId }: { orderId: string }) =>
  formSchema({
    schema: OrderChangeStatusInputSchema,
    toInput: ({ values }: { values: ChangeStatusFormValues }) => ({
      orderId,
      statusId: values.statusId,
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });
