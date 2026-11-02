import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { TicketSchema } from "./schema";

export const TICKET_LIST_SORTS = [
  "reference",
  "customer",
  "type",
  "status",
  "when",
  "quantity",
] as const;

export type TicketListSort = (typeof TICKET_LIST_SORTS)[number];

/** Search qualifiers on names and people (`assignee:me`, `status:Lead`). */
export const TICKET_NAME_QUALIFIERS = [
  "assignee",
  "follower",
  "status",
  "type",
  "customer",
  "contact",
  "is",
] as const;

/** Search qualifiers on the ticket's own dates and numbers (`when:2026-12`, `guests:>50`). */
export const TICKET_MEASURES = ["when", "created", "guests", "budget", "holds", "no"] as const;

/** Every qualifier `ticket.list`'s `q` understands, GitHub style. */
export const TICKET_QUALIFIERS = [...TICKET_NAME_QUALIFIERS, ...TICKET_MEASURES] as const;

export type TicketQualifier = (typeof TICKET_QUALIFIERS)[number];
export type TicketMeasure = (typeof TICKET_MEASURES)[number];

/** Fixed values: `is:`, `holds:` (besides dates) and `no:`. */
export const TICKET_IS_VALUES = ["open", "closed"] as const;
export const TICKET_HOLDS_VALUES = ["expired", "soon"] as const;
export const TICKET_EMPTY_FIELDS = [
  "assignee",
  "contact",
  "date",
  "guests",
  "budget",
  "holds",
] as const;

export const TicketListInputSchema = z.object({
  customerId: z.string().optional().describe("Only tickets of this customer"),
  entityTypeId: z.string().optional().describe("Only tickets of this type"),
  statusId: z.string().optional().describe("Only tickets in this status"),
  assigneeId: z.string().optional().describe("Only tickets this user is assigned to"),
  followerId: z.string().optional().describe("Only tickets this user follows"),
  from: z.coerce.date().optional().describe("Only tickets whose desired period ends after this"),
  to: z.coerce.date().optional().describe("Only tickets whose desired period starts before this"),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe(
      "Search, GitHub style: free text matches the reference (`42`, `#42`), customer or " +
        "contact name, or note; qualifiers filter: `assignee:me`, `assignee:<member name>`, " +
        "`follower:me`, `status:<name>`, `type:<name>`, `customer:<name>`, `contact:<name>`, " +
        "`is:open|closed`, `no:assignee|contact|date|guests|budget|holds`; dates in the " +
        "organization's zone: `when:` (desired start) and `created:` take `2026-12`, " +
        "`>=2026-12-01` or `2026-11-01..2026-11-30`; `holds:expired|soon` or a date; numbers: " +
        "`guests:>50`, `budget:10000..50000` (whole currency units). " +
        'Prefix `-` to exclude, quote spaces (`customer:"Volvo Cars"`), ' +
        "commas for alternatives (`status:Lead,Offer`).",
    ),
  sort: z.enum(TICKET_LIST_SORTS).default("reference").describe("Order by this column"),
  direction: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Page number (from 1) of `limit` tickets; returns `total`. Replaces `cursor`"),
  ...PageInputShape,
});

export type TicketListInput = z.infer<typeof TicketListInputSchema>;

export const TicketListOutputSchema = z.object({
  items: z.array(TicketSchema),
  nextCursor: z.string().nullable(),
  /** The number of matching tickets; only with `page`, else null. */
  total: z.number().int().nullable(),
});
