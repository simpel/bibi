import { z } from "zod";
import { RruleStringSchema } from "../../recurrence/rrule-string-schema";

/**
 * An RRULE string kept as a string (GraphQL, REST and forms see a plain text field), checked
 * against the ADR 0023 subset. The handler parses it with `RruleStringSchema`.
 */
export const RruleInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .superRefine((rrule, ctx) => {
    const parsed = RruleStringSchema.safeParse(rrule);
    if (parsed.success) return;
    for (const issue of parsed.error.issues)
      ctx.addIssue({ code: "custom", message: issue.message });
  })
  .describe(
    "Recurrence, RRULE subset: FREQ=WEEKLY|MONTHLY, INTERVAL, BYDAY (e.g. TH or 1TU), " +
      "BYMONTHDAY, COUNT or UNTIL. Example: FREQ=MONTHLY;BYDAY=1TU;COUNT=10",
  );
