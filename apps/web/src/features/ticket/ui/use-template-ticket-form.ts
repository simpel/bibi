import type { TicketCreateFromTemplateInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createTicketFromTemplateAction } from "../actions";
import {
  type TemplateTicketFormValues,
  templateTicketDefaults,
  templateTicketFormSchema,
} from "./template-ticket-form-schema";

/**
 * Short create form state. A refused creation (ADR 0043) shows the blocked lines on the template
 * and a missing assignee on the assignee field; success opens the new ticket.
 */
export function useTemplateTicketForm() {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<TemplateTicketFormValues, unknown, TicketCreateFromTemplateInput>({
    resolver: zodResolver(templateTicketFormSchema, useZodMessages()),
    defaultValues: templateTicketDefaults,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createTicketFromTemplateAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => router.push(ticketRoute({ id: value.id })),
    onError: ({ error }) => {
      const lines = error.issues.filter(({ path }) => path.startsWith("lines.")).length;
      if (lines > 0)
        form.setError("templateId", { message: t("templateBlocked", { count: lines }) });
      if (error.issues.some(({ path }) => path === "assigneeId")) {
        form.setError("assigneeId", { message: t("assigneeRequired") });
      }
    },
  });
  return { form, submit, pending };
}
