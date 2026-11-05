import type { OrderDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useFormAction } from "@/lib/use-form-action";
import { createOrderAction, updateOrderAction } from "../actions";
import type { OrderFormData } from "./order-form-data";
import { type OrderFormOutput, orderFormSchema, toOrderUpdate } from "./order-form-schema";
import { type OrderFormValues, orderFormDefaults } from "./order-form-values";

export type UseOrderFormInput = {
  data: OrderFormData;
  /** Present = edit mode, absent = create mode. */
  order?: OrderDto | undefined;
  onDone: () => void;
};

/** Order form state; a new order opens its page, an edit refreshes it. */
export function useOrderForm({ data, order, onDone }: UseOrderFormInput) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const timeZone = useOrganizationTimeZone();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<OrderFormValues, OrderFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => orderFormSchema({ type, vocabularies: data.vocabularies, timeZone }),
  });
  const initial = typeOf({ id: order?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<OrderFormValues, unknown, OrderFormOutput>({
    resolver,
    defaultValues: orderFormDefaults({ type: initial, order, timeZone }),
  });
  const { submit, run, pending } = useFormAction({
    form,
    action: ({ values }) =>
      order
        ? updateOrderAction({
            input: toOrderUpdate({ order, values, type: typeOf({ id: order.entityTypeId }) }),
          })
        : createOrderAction({ input: values }),
    messages: { pending: common("saving"), success: t(order ? "updated" : "created") },
    onSuccess: ({ value }) => {
      onDone();
      if (order) router.refresh();
      else router.push(orderRoute({ id: value.id }));
    },
  });
  return { form, submit, run, pending, typeOf };
}
