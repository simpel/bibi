import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { NotificationKindSchema, NotificationSchema } from "./schema";

/** Sort keys of `notification.list`; the web table's column ids match them. */
export const NOTIFICATION_LIST_SORTS = ["created", "kind", "ticket", "read"] as const;
export type NotificationListSort = (typeof NOTIFICATION_LIST_SORTS)[number];

/** `unread` and `read` narrow the list; no value lists both. */
export const NOTIFICATION_READ_FILTERS = ["unread", "read"] as const;

export const NotificationListInputSchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe("Text in the ticket's title, or its reference number"),
  kind: NotificationKindSchema.optional().describe("Only notifications of this kind"),
  read: z.enum(NOTIFICATION_READ_FILTERS).optional().describe("Only unread or only read ones"),
  sort: z.enum(NOTIFICATION_LIST_SORTS).default("created"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Numbered page (1 = first); when given, `total` counts every match"),
  ...PageInputShape,
});
export type NotificationListInput = z.infer<typeof NotificationListInputSchema>;

export const NotificationListOutputSchema = z.object({
  items: z.array(NotificationSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nullable().describe("Every match; only with `page`"),
});
