import type { TicketTemplateDto } from "@okazi/core/schemas";
import { TicketTemplateCreateInputSchema } from "@okazi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of one line row; the setup is carried over unseen and dropped with the item. */
export type TemplateLineValues = {
  name: string;
  entityTypeId: string;
  itemId: string;
  setupId: string;
  offsetMinutes: string;
  durationMinutes: string;
  /** Empty: the line counts the ticket's headcount (ADR 0052). */
  quantity: string;
};

/** Raw values of the predefined ticket form. */
export type TicketTemplateFormValues = {
  name: string;
  entityTypeId: string;
  phaseId: string;
  lines: TemplateLineValues[];
};

const none = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

/** Form values → core's `ticketTemplate.create` input; `fields` (defaults) are set elsewhere. */
export const ticketTemplateFormSchema = formSchema({
  schema: TicketTemplateCreateInputSchema,
  toInput: ({ values }: { values: TicketTemplateFormValues }) => ({
    ...values,
    name: values.name.trim(),
    lines: values.lines.map((line) => ({
      ...line,
      name: line.name.trim(),
      itemId: none({ value: line.itemId }),
      setupId: line.itemId === NONE ? null : none({ value: line.setupId }),
      offsetMinutes: numberOrNull({ value: line.offsetMinutes }),
      durationMinutes: numberOrNull({ value: line.durationMinutes }),
      quantity: numberOrNull({ value: line.quantity }),
    })),
  }),
});

export const emptyLine = ({ entityTypeId }: { entityTypeId: string }): TemplateLineValues => ({
  name: "",
  entityTypeId,
  itemId: NONE,
  setupId: "",
  offsetMinutes: "0",
  durationMinutes: "60",
  quantity: "",
});

export type FormDefaultsInput = {
  template?: TicketTemplateDto | undefined;
  firstTypes: { ticketType: string; phase: string };
};

export function ticketTemplateFormDefaults({
  template,
  firstTypes,
}: FormDefaultsInput): TicketTemplateFormValues {
  return {
    name: template?.name ?? "",
    entityTypeId: template?.entityTypeId ?? firstTypes.ticketType,
    phaseId: template?.phaseId ?? firstTypes.phase,
    lines: (template?.lines ?? []).map((line) => ({
      name: line.name,
      entityTypeId: line.entityTypeId,
      itemId: line.itemId ?? NONE,
      setupId: line.setupId ?? "",
      offsetMinutes: String(line.offsetMinutes),
      durationMinutes: String(line.durationMinutes),
      quantity: line.quantity === null ? "" : String(line.quantity),
    })),
  };
}
