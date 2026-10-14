import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

export const SetupSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  changeoverMinutes: z.number().int(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const SetupCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).describe("Setup name, e.g. Bio, U-bord or Mingel"),
  changeoverMinutes: z
    .number()
    .int()
    .min(0)
    .max(24 * 60)
    .optional()
    .describe("Time needed to set the space up this way, in minutes"),
});

export const SetupUpdateInputSchema = SetupCreateInputSchema.partial().extend({
  id: z.string().min(1),
});

export const SetupIdInputSchema = z.object({ id: z.string().min(1) });

export const SetupListInputSchema = z.object(PageInputShape);

export const SetupListOutputSchema = z.object({
  items: z.array(SetupSchema),
  nextCursor: z.string().nullable(),
});

export type SetupDto = z.infer<typeof SetupSchema>;
export type SetupCreateInput = z.infer<typeof SetupCreateInputSchema>;
