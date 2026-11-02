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
