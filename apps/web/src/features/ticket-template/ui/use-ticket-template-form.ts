import type { TicketTemplateCreateInput, TicketTemplateDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createTicketTemplateAction, updateTicketTemplateAction } from "../actions";
import type { TicketTemplateFormData } from "./ticket-template-form-data";
import {
  type TicketTemplateFormValues,
  ticketTemplateFormDefaults,
  ticketTemplateFormSchema,
} from "./ticket-template-form-schema";

export type UseTicketTemplateFormInput = {
  data: TicketTemplateFormData;
  /** Present = edit mode, absent = create mode. */
  template?: TicketTemplateDto | undefined;
};

type SaveInput = { template: TicketTemplateDto | undefined; values: TicketTemplateCreateInput };

const save = ({ template, values }: SaveInput) =>
  template
    ? updateTicketTemplateAction({ input: { id: template.id, ...values } })
    : createTicketTemplateAction({ input: values });

/** Predefined ticket form state; saving (or cancelling) goes back to the list. */
export function useTicketTemplateForm({ data, template }: UseTicketTemplateFormInput) {
  const t = useTranslations("ticketTemplate");
  const router = useRouter();
  const form = useForm<TicketTemplateFormValues, unknown, TicketTemplateCreateInput>({
    resolver: zodResolver(ticketTemplateFormSchema, useZodMessages()),
    defaultValues: ticketTemplateFormDefaults({
      template,
      firstTypes: {
        ticketType: data.ticketTypes[0]?.id ?? "",
        ticketStatus: data.statuses[0]?.id ?? "",
      },
    }),
  });
  const back = () => router.push(ROUTES.settingsTicketTemplates);
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
