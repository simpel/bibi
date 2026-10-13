import { z } from "zod";

export const ASSISTANT_LOCALES = ["sv", "en"] as const;

export const AssistantLocaleSchema = z.enum(ASSISTANT_LOCALES);

export type AssistantLocale = z.infer<typeof AssistantLocaleSchema>;

/** Where the user is in the web app when asking (sent by the panel / ⌘K). Untrusted hint only. */
export const PageContextSchema = z.object({
  route: z.string().trim().min(1).max(300).describe("Pathname, e.g. /sv/venues/abc"),
  locale: AssistantLocaleSchema,
  entity: z
    .object({
      type: z.string().trim().min(1).max(50).regex(/^[a-z][a-z_]*$/),
      id: z.string().trim().min(1).max(200),
    })
    .optional()
    .describe("Entity shown on the page, e.g. { type: 'venue', id }"),
});

export type PageContext = z.infer<typeof PageContextSchema>;
