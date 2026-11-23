import { OrderPreviewLinesInputSchema, PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { IntakeWhen } from "./intake-state";

/** Raw values of step 2: a plain day, two wall times and the guests as typed. */
export type WhenFormValues = { date: string; from: string; to: string; guests: string };

export const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export type WhenFormSchemaInput = {
  /** Now as the organization's wall time, `YYYY-MM-DDTHH:mm` (`toLocalInputValue`). */
  now: string;
};

/**
 * Step 2's rules: the day and times core's preview takes once converted at the edge (ADR 0064),
 * and its headcount with at least one guest. A `to` at or before `from` ends the next day, so only
 * an equal pair is refused. The start may not have passed: a past day is refused on the date,
 * a past time today on `from`.
 */
export function whenFormSchema({ now }: WhenFormSchemaInput) {
  const today = now.slice(0, 10);
  return formSchema({
    schema: z
      .object({
        date: PlainDateStringSchema.refine((date) => date >= today, { params: { key: "inPast" } }),
        from: TimeOfDaySchema,
        to: TimeOfDaySchema,
        guests: OrderPreviewLinesInputSchema.shape.headcount.min(1),
      })
      .refine(({ from, to }) => from !== to, { path: ["to"] })
      .refine(({ date, from }) => date !== today || `${date}T${from}` >= now, {
        path: ["from"],
        params: { key: "inPast" },
      }),
    toInput: ({ values }: { values: WhenFormValues }) => ({
      ...values,
      guests: numberOrUndefined({ value: values.guests }),
    }),
  });
}

export type WhenFormDefaultsInput = { when: IntakeWhen | null };

export function whenFormDefaults({ when }: WhenFormDefaultsInput): WhenFormValues {
  if (!when) return { date: "", from: "", to: "", guests: "" };
  return { ...when, guests: String(when.guests) };
}
