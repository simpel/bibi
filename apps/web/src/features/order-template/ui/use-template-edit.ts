import type { OrderTemplateCreateInput, OrderTemplateDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useInlineEdit } from "@/components/inline-edit/inline-edit";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateOrderTemplateAction } from "../actions";
import type { OrderTemplateFormData } from "./order-template-form-data";
import {
  type OrderTemplateFormValues,
  orderTemplateFormDefaults,
  orderTemplateFormSchema,
} from "./order-template-form-schema";
import { pickGroups, type TemplateEditGroup } from "./template-edit-groups";

export type UseTemplateEditInput = {
  template: OrderTemplateDto;
  data: OrderTemplateFormData;
  groups: readonly TemplateEditGroup[];
  /** Changes the starting values, e.g. the line dialog appends an empty line to fill in. */
  prepare?: (values: OrderTemplateFormValues) => OrderTemplateFormValues;
};

/**
 * One in-place editor of a template (a fact's popover, the picture, the line dialog): the whole
 * template's form state and checks, but only `groups` are sent. Saving closes and refreshes.
 */
export function useTemplateEdit({ template, data, groups, prepare }: UseTemplateEditInput) {
  const t = useTranslations("orderTemplate");
  const router = useRouter();
  const { close } = useInlineEdit();
  const form = useForm<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>({
    resolver: zodResolver(orderTemplateFormSchema, useZodMessages()),
    defaultValues: (prepare ?? ((values) => values))(
      orderTemplateFormDefaults({
        template,
        firstTypes: {
          orderType: data.orderTypes[0]?.id ?? "",
          orderStatus: data.statuses[0]?.id ?? "",
        },
      }),
    ),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      updateOrderTemplateAction({
        input: { id: template.id, ...pickGroups({ values, groups }) },
      }),
    messages: { pending: t("saving"), success: t("updated") },
    onSuccess: () => {
      close();
      router.refresh();
    },
  });
  return { form, submit, pending, close };
}
