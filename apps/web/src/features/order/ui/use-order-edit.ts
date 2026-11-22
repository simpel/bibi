import type { OrderDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useInlineEdit } from "@/components/inline-edit/inline-edit";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useFormAction } from "@/lib/use-form-action";
import { updateOrderAction } from "../actions";
import type { OrderFormData } from "./order-form-data";
import {
  type OrderEditGroup,
  type OrderFormOutput,
  orderFormSchema,
  toOrderUpdate,
} from "./order-form-schema";
import { type OrderFormValues, orderFormDefaults } from "./order-form-values";

export type UseOrderEditInput = {
  order: OrderDto;
  data: Pick<OrderFormData, "types" | "vocabularies">;
  groups: readonly OrderEditGroup[];
};

/**
 * One in-place editor of an order (a fact's popover, the Details section): the whole order's
 * form state and checks, but only `groups` are sent. Saving closes the editor and refreshes.
 */
export function useOrderEdit({ order, data, groups }: UseOrderEditInput) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const { close } = useInlineEdit();
  const timeZone = useOrganizationTimeZone();
  const type = data.types.find(({ id }) => id === order.entityTypeId);
  const resolver = useTypedResolver<OrderFormValues, OrderFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => orderFormSchema({ type, vocabularies: data.vocabularies, timeZone }),
  });
  const form = useForm<OrderFormValues, unknown, OrderFormOutput>({
    resolver,
    defaultValues: orderFormDefaults({ type, order, timeZone }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      updateOrderAction({ input: toOrderUpdate({ order, values, type, groups }) }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: () => {
      close();
      router.refresh();
    },
  });
  return { form, submit, pending, type, close };
}
