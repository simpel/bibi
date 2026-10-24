import { TimeZoneSchema } from "@bibi/core/schemas";
import { z } from "zod";

/** `/welcome/new` (ADR 0062, 0064). The slug pattern matches `SLUG_PATTERN` in `@bibi/auth`. */
export const NewOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/),
  timeZone: TimeZoneSchema,
});

export type NewOrganizationValues = z.infer<typeof NewOrganizationSchema>;
