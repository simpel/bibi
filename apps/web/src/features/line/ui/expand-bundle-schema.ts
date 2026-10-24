import { LineExpandBundleInputSchema } from "@bibi/core/schemas";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";
import { type LineTimeZoneInput, lineTimeZone } from "./line-time-zone";

/** Raw values of the bundle form: inputs are strings. */
export type ExpandBundleFormValues = {
  entityTypeId: string;
  itemId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  quantity: string;
};

export type ExpandBundleSchemaInput = { ticketId: string; zones: LineTimeZoneInput["data"] };

/**
 * Core's `line.expandBundle` schema over the raw form values, for one ticket. The times are read
 * in the zone of the bundle's venue (ADR 0064).
 */
export function expandBundleSchema({ ticketId, zones }: ExpandBundleSchemaInput) {
  return formSchema({
    schema: LineExpandBundleInputSchema,
    toInput: ({ values }: { values: ExpandBundleFormValues }) => {
      const timeZone = lineTimeZone({ data: zones, itemId: values.itemId });
      const instant = ({ value }: { value: string }) =>
        fromLocalInputValue({ value, timeZone }) ?? null;
      return {
        ticketId,
        entityTypeId: values.entityTypeId,
        itemId: values.itemId,
        name: blankToNull({ value: values.name }) ?? undefined,
        // Both empty = untimed lines (ADR 0052).
        startsAt: instant({ value: values.startsAt }),
        endsAt: instant({ value: values.endsAt }),
        quantity: numberOrNull({ value: values.quantity }),
      };
    },
  });
}

const FOUR_HOURS_MS = 4 * 3_600_000;

export type ExpandBundleDefaultsInput = {
  entityTypeId: string;
  itemId: string;
  startsAt: Date;
  /** The zone of the first bundle's venue. */
  timeZone: string;
};

/** The first line type and bundle, from the ticket's start for four hours. */
export const expandBundleDefaults = ({
  entityTypeId,
  itemId,
  startsAt,
  timeZone,
}: ExpandBundleDefaultsInput): ExpandBundleFormValues => ({
  ...{ entityTypeId, itemId, name: "", quantity: "" },
  startsAt: toLocalInputValue({ date: startsAt, timeZone }),
  endsAt: toLocalInputValue({ date: new Date(startsAt.getTime() + FOUR_HOURS_MS), timeZone }),
});
