import { PlainDateStringSchema, TicketPreviewLinesInputSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { IntakeWhen } from "./intake-state";

/** Raw values of step 2: a plain day, two wall times and the guests as typed. */
export type WhenFormValues = { date: string; from: string; to: string; guests: string };

const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/**
 * Step 2's rules: the day and times core's preview takes once converted at the edge (ADR 0064),
 * and its headcount with at least one guest. A `to` at or before `from` ends the next day, so only
 * an equal pair is refused.
 */
export const whenFormSchema = formSchema({
  schema: z
    .object({
      date: PlainDateStringSchema,
      from: TimeOfDaySchema,
      to: TimeOfDaySchema,
      guests: TicketPreviewLinesInputSchema.shape.headcount.min(1),
    })
    .refine(({ from, to }) => from !== to, { path: ["to"] }),
  toInput: ({ values }: { values: WhenFormValues }) => ({
    ...values,
    guests: numberOrUndefined({ value: values.guests }),
  }),
});

export type WhenFormDefaultsInput = { when: IntakeWhen | null };

export function whenFormDefaults({ when }: WhenFormDefaultsInput): WhenFormValues {
  if (!when) return { date: "", from: "", to: "", guests: "" };
  return { ...when, guests: String(when.guests) };
}
