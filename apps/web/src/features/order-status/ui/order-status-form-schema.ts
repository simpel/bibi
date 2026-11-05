import type { OrderStatusDto, OrderStatusUpdateInput, StatusEvent } from "@bibi/core/schemas";
import { OrderStatusUpdateInputSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the status edit form: name, color and the generic status flags (ADR 0043). */
export type OrderStatusFormValues = {
  name: string;
  color: string;
  entry: boolean;
  closes: boolean;
  invoiceable: boolean;
  /** The quote event that enters the status, or `NONE`. */
  event: StatusEvent | typeof NONE;
};

export type OrderStatusFormInput = { values: OrderStatusFormValues };

/** What the edit form saves: `orderStatus.update` without the id. */
export type OrderStatusEdit = Omit<OrderStatusUpdateInput, "id">;

/** Form values → the shape core's `orderStatus.update` input schema validates (without the id). */
export function orderStatusFormToInput({ values }: OrderStatusFormInput) {
  const event = values.event === NONE ? null : values.event;
  return { ...values, event, name: values.name.trim() };
}

export const orderStatusFormSchema = formSchema({
  schema: OrderStatusUpdateInputSchema.omit({ id: true }),
  toInput: orderStatusFormToInput,
});

export type OrderStatusDefaultsInput = { orderStatus: OrderStatusDto };

export function orderStatusFormDefaults({
  orderStatus,
}: OrderStatusDefaultsInput): OrderStatusFormValues {
  return {
    name: orderStatus.name,
    color: orderStatus.color,
    entry: orderStatus.entry,
    closes: orderStatus.closes,
    invoiceable: orderStatus.invoiceable,
    event: orderStatus.event ?? NONE,
  };
}
