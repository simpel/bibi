import { LineExpandBundleInputSchema } from "@okazi/core/schemas";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the bundle form: inputs are strings. */
export type ExpandBundleFormValues = {
  entityTypeId: string;
  itemId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  quantity: string;
};

/** Core's `line.expandBundle` schema over the raw form values, for one ticket. */
export function expandBundleSchema({ ticketId }: { ticketId: string }) {
  return formSchema({
    schema: LineExpandBundleInputSchema,
    toInput: ({ values }: { values: ExpandBundleFormValues }) => ({
      ticketId,
      entityTypeId: values.entityTypeId,
      itemId: values.itemId,
      name: blankToNull({ value: values.name }) ?? undefined,
      // Both empty = untimed lines (ADR 0052).
      startsAt: fromLocalInputValue({ value: values.startsAt }) ?? null,
      endsAt: fromLocalInputValue({ value: values.endsAt }) ?? null,
      quantity: numberOrNull({ value: values.quantity }),
    }),
  });
}

const FOUR_HOURS_MS = 4 * 3_600_000;

export type ExpandBundleDefaultsInput = { entityTypeId: string; itemId: string; startsAt: Date };

/** The first line type and bundle, from the ticket's start for four hours. */
export const expandBundleDefaults = ({
  entityTypeId,
  itemId,
  startsAt,
}: ExpandBundleDefaultsInput): ExpandBundleFormValues => ({
  ...{ entityTypeId, itemId, name: "", quantity: "" },
  startsAt: toLocalInputValue({ date: startsAt }),
  endsAt: toLocalInputValue({ date: new Date(startsAt.getTime() + FOUR_HOURS_MS) }),
});
