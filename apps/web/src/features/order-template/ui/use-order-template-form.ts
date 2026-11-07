import type { OrderTemplateCreateInput, OrderTemplateDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createOrderTemplateAction, updateOrderTemplateAction } from "../actions";
import type { OrderTemplateFormData } from "./order-template-form-data";
import {
  type OrderTemplateFormValues,
  orderTemplateFormDefaults,
  orderTemplateFormSchema,
} from "./order-template-form-schema";

export type UseOrderTemplateFormInput = {
  data: OrderTemplateFormData;
  /** Present = edit mode, absent = create mode. */
  template?: OrderTemplateDto | undefined;
};

type SaveInput = { template: OrderTemplateDto | undefined; values: OrderTemplateCreateInput };

const save = ({ template, values }: SaveInput) =>
  template
    ? updateOrderTemplateAction({ input: { id: template.id, ...values } })
    : createOrderTemplateAction({ input: values });

/** Predefined order form state; saving (or cancelling) goes back to the list. */
export function useOrderTemplateForm({ data, template }: UseOrderTemplateFormInput) {
  const t = useTranslations("orderTemplate");
  const router = useRouter();
  const form = useForm<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>({
    resolver: zodResolver(orderTemplateFormSchema, useZodMessages()),
    defaultValues: orderTemplateFormDefaults({
      template,
      firstTypes: {
        orderType: data.orderTypes[0]?.id ?? "",
        orderStatus: data.statuses[0]?.id ?? "",
      },
    }),
  });
  const back = () => router.push(ROUTES.adminOrderTemplates);
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ template, values }),
    messages: { pending: t("saving"), success: t(template ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      back();
    },
  });
  return { form, submit, pending, back };
}
