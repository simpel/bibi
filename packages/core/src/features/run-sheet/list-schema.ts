import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import type { OrderQualifier } from "../order/list-schema";
import { RunSheetSchema } from "./schema";

export const RUN_SHEET_LIST_SORTS = [
  "created",
  "when",
  "order",
  "definition",
  "responsibility",
  "version",
  "published",
  "sent",
] as const;

export type RunSheetListSort = (typeof RUN_SHEET_LIST_SORTS)[number];

/** People on the run sheet's slot: its responsibility on its order (ADR 0055). */
export const RUN_SHEET_PEOPLE_QUALIFIERS = ["assignee", "follower", "involves"] as const;

/** The run sheet's own qualifiers. */
export const RUN_SHEET_OWN_QUALIFIERS = ["definition", "responsibility", "is"] as const;

/** Order qualifiers that filter run sheets by their order, as on `order.list`. */
export const RUN_SHEET_ORDER_QUALIFIERS = [
  "status",
  "type",
  "customer",
  "contact",
  "when",
  "created",
  "guests",
] as const satisfies readonly OrderQualifier[];

/** Every qualifier `runSheet.list`'s `q` understands, GitHub style. */
export const RUN_SHEET_QUALIFIERS = [
  ...RUN_SHEET_PEOPLE_QUALIFIERS,
  ...RUN_SHEET_OWN_QUALIFIERS,
  ...RUN_SHEET_ORDER_QUALIFIERS,
] as const;

export type RunSheetQualifier = (typeof RUN_SHEET_QUALIFIERS)[number];

/** `is:` values: the version's own state, or its order's (`open`, `closed`). */
export const RUN_SHEET_IS_VALUES = [
  "current",
  "published",
  "draft",
  "pending",
  "fulfilled",
  "revision",
  "sent",
  "unsent",
  "blocked",
  "open",
  "closed",
] as const;

export const RunSheetListInputSchema = z.object({
  orderId: z.string().optional().describe("Only run sheets of this order"),
  runSheetDefinitionId: z
    .string()
    .optional()
    .describe("Only versions of this run sheet definition"),
  from: z.coerce.date().optional().describe("Only run sheets whose order ends after this"),
  to: z.coerce.date().optional().describe("Only run sheets whose order starts before this"),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe(
      "Search, GitHub style: free text matches the order's reference (`42`, `#42`) or title; " +
        "qualifiers filter: `involves:me` (assignee or follower of the run sheet's " +
        "responsibility on its order), `assignee:me|<member>`, `follower:me|<member>`, " +
        "`definition:<name>`, `responsibility:<name>`, `is:current|sent|unsent|blocked|open|" +
        "closed`, and the order's `status:`, `type:`, `customer:`, `contact:`, `when:`, " +
        "`created:`, `guests:` as on order.list. Prefix `-` to exclude, quote spaces, commas " +
        "for alternatives.",
    ),
  sort: z.enum(RUN_SHEET_LIST_SORTS).default("created").describe("Order by this column"),
  direction: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Page number (from 1) of `limit` run sheets; returns `total`. Replaces `cursor`"),
  ...PageInputShape,
});

export type RunSheetListInput = z.infer<typeof RunSheetListInputSchema>;

export const RunSheetListOutputSchema = z.object({
  items: z.array(RunSheetSchema),
  nextCursor: z.string().nullable(),
  /** The number of matching run sheets; only with `page`, else null. */
  total: z.number().int().nullable(),
});
