import { TicketCreateFromTemplateInputSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the short create form: template, customer, start, headcount and assignee. */
export type TemplateTicketFormValues = {
  templateId: string;
  customerId: string;
  startsAt: string;
  headcount: string;
  assigneeId: string;
};

/** `timeZone`: the organization's, the start is a ticket-level time (ADR 0064). */
export const templateTicketFormSchema = ({ timeZone }: { timeZone: string }) =>
  formSchema({
    schema: TicketCreateFromTemplateInputSchema,
    toInput: ({ values }: { values: TemplateTicketFormValues }) => ({
      templateId: values.templateId,
      customerId: values.customerId,
      startsAt: fromLocalInputValue({ value: values.startsAt, timeZone }),
      headcount: numberOrNull({ value: values.headcount }),
      assigneeId: values.assigneeId === NONE || values.assigneeId === "" ? null : values.assigneeId,
    }),
  });

export const templateTicketDefaults: TemplateTicketFormValues = {
  templateId: "",
  customerId: "",
  startsAt: "",
  headcount: "",
  assigneeId: NONE,
};
