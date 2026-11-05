import { OrderStatusCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of a new status: only its name and colour; flags are set when editing it. */
export type NewOrderStatusFormValues = { name: string; color: string };

export const NEW_ORDER_STATUS_DEFAULTS: NewOrderStatusFormValues = {
  name: "",
  color: "#64748b",
};

/** Form values → the shape core's `orderStatus.create` input schema validates. */
export const newOrderStatusFormSchema = formSchema({
  schema: OrderStatusCreateInputSchema,
  toInput: ({ values }: { values: NewOrderStatusFormValues }) => ({
    ...values,
    name: values.name.trim(),
  }),
});
