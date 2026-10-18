import { TicketCreateFromTemplateInputSchema } from "@okazi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the short create form: template, customer, start, headcount and assignee. */
export type TemplateTicketFormValues = {
  templateId: string;
  customerId: string;
  startsAt: string;
  quantity: string;
  assigneeId: string;
};

export const templateTicketFormSchema = formSchema({
  schema: TicketCreateFromTemplateInputSchema,
  toInput: ({ values }: { values: TemplateTicketFormValues }) => ({
    templateId: values.templateId,
    customerId: values.customerId,
    startsAt: fromLocalInputValue({ value: values.startsAt }),
    quantity: numberOrNull({ value: values.quantity }),
    assigneeId: values.assigneeId === NONE || values.assigneeId === "" ? null : values.assigneeId,
  }),
});

export const templateTicketDefaults: TemplateTicketFormValues = {
  templateId: "",
  customerId: "",
  startsAt: "",
  quantity: "",
  assigneeId: NONE,
};
