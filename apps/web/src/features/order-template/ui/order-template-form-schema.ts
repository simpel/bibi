import type { OrderTemplateDto } from "@bibi/core/schemas";
import { OrderTemplateCreateInputSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of one line row; the layout is carried over unseen and dropped with the item. */
export type TemplateLineValues = {
  name: string;
  entityTypeId: string;
  itemId: string;
  layoutId: string;
  offsetMinutes: string;
  durationMinutes: string;
  /** Empty: the line counts the order's headcount (ADR 0052). */
  quantity: string;
  /** The choices the package preselects, option item ids (ADR 0089). */
  options: string[];
  /** Defaults that no longer fit the item: shown, never sent, so saving drops them. */
  staleOptions: string[];
};

/** Raw values of the predefined order form. */
export type OrderTemplateFormValues = {
  name: string;
  entityTypeId: string;
  statusId: string;
  /** Fewest and most guests the package is made for; empty: no limit. */
  minGuests: string;
  maxGuests: string;
  lines: TemplateLineValues[];
};

const none = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

/** Form values → core's `orderTemplate.create` input; `fields` (defaults) are set elsewhere. */
export const orderTemplateFormSchema = formSchema({
  schema: OrderTemplateCreateInputSchema,
  toInput: ({ values }: { values: OrderTemplateFormValues }) => ({
    ...values,
    name: values.name.trim(),
    minGuests: numberOrNull({ value: values.minGuests }),
    maxGuests: numberOrNull({ value: values.maxGuests }),
    lines: values.lines.map(({ staleOptions: _stale, ...line }) => ({
      ...line,
      name: line.name.trim(),
      itemId: none({ value: line.itemId }),
      layoutId: line.itemId === NONE ? null : none({ value: line.layoutId }),
      offsetMinutes: numberOrNull({ value: line.offsetMinutes }),
      durationMinutes: numberOrNull({ value: line.durationMinutes }),
      quantity: numberOrNull({ value: line.quantity }),
      // Defaults belong to the item: none without one.
      options: line.itemId === NONE ? [] : line.options.map((itemId) => ({ itemId })),
    })),
  }),
});

export const emptyLine = ({ entityTypeId }: { entityTypeId: string }): TemplateLineValues => ({
  name: "",
  entityTypeId,
  itemId: NONE,
  layoutId: "",
  offsetMinutes: "0",
  durationMinutes: "60",
  quantity: "",
  options: [],
  staleOptions: [],
});

export type FormDefaultsInput = {
  template?: OrderTemplateDto | undefined;
  firstTypes: { orderType: string; orderStatus: string };
};

export function orderTemplateFormDefaults({
  template,
  firstTypes,
}: FormDefaultsInput): OrderTemplateFormValues {
  return {
    name: template?.name ?? "",
    entityTypeId: template?.entityTypeId ?? firstTypes.orderType,
    statusId: template?.statusId ?? firstTypes.orderStatus,
    minGuests: template?.minGuests == null ? "" : String(template.minGuests),
    maxGuests: template?.maxGuests == null ? "" : String(template.maxGuests),
    lines: (template?.lines ?? []).map((line) => ({
      name: line.name,
      entityTypeId: line.entityTypeId,
      itemId: line.itemId ?? NONE,
      layoutId: line.layoutId ?? "",
      offsetMinutes: String(line.offsetMinutes),
      durationMinutes: String(line.durationMinutes),
      quantity: line.quantity === null ? "" : String(line.quantity),
      options: line.options.filter(({ stale }) => !stale).map(({ itemId }) => itemId),
      staleOptions: line.options.filter(({ stale }) => stale).map(({ itemId }) => itemId),
    })),
  };
}
