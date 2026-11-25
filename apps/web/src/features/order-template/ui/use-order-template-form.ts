import type { OrderTemplateCreateInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createOrderTemplateAction } from "../actions";
import { orderTemplateHref } from "../template-route";
import type { OrderTemplateFormData } from "./order-template-form-data";
import {
  type OrderTemplateFormValues,
  orderTemplateFormDefaults,
  orderTemplateFormSchema,
} from "./order-template-form-schema";

export type UseOrderTemplateFormInput = { data: OrderTemplateFormData };

/** The create form's state: saving opens the new template's page, Cancel goes back to the list. */
export function useOrderTemplateForm({ data }: UseOrderTemplateFormInput) {
  const t = useTranslations("orderTemplate");
  const router = useRouter();
  const form = useForm<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>({
    resolver: zodResolver(orderTemplateFormSchema, useZodMessages()),
    defaultValues: orderTemplateFormDefaults({
      firstTypes: {
        orderType: data.orderTypes[0]?.id ?? "",
        orderStatus: data.statuses[0]?.id ?? "",
      },
    }),
  });
  const back = () => router.push(ROUTES.packages);
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createOrderTemplateAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: ({ value }) => router.push(orderTemplateHref({ id: value.id })),
  });
  return { form, submit, pending, back };
}
