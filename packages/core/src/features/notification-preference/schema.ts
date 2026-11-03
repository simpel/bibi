import { z } from "zod";
import { NotificationKindSchema } from "../notification/schema";

/** Whether the caller gets one kind of notification (ADR 0094); on unless they turned it off. */
export const NotificationPreferenceSchema = z.object({
  kind: NotificationKindSchema,
  enabled: z.boolean(),
  updatedAt: z.date().nullable().describe("When the caller chose; null = the default (on)"),
});
export type NotificationPreferenceDto = z.infer<typeof NotificationPreferenceSchema>;

export const NotificationPreferenceListInputSchema = z.object({});

export const NotificationPreferenceListOutputSchema = z.object({
  items: z.array(NotificationPreferenceSchema).describe("One per kind, in a fixed order"),
});

export const NotificationPreferenceSetInputSchema = z.object({
  kind: NotificationKindSchema,
  enabled: z.boolean().describe("false = do not notify me of this kind"),
});
export type NotificationPreferenceSetInput = z.infer<typeof NotificationPreferenceSetInputSchema>;
