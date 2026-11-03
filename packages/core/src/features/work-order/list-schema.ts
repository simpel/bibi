import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import type { TicketQualifier } from "../ticket/list-schema";
import { WorkOrderSchema } from "./schema";

export const WORK_ORDER_LIST_SORTS = [
  "created",
  "when",
  "ticket",
  "definition",
  "responsibility",
  "version",
  "sent",
] as const;

export type WorkOrderListSort = (typeof WORK_ORDER_LIST_SORTS)[number];

/** People on the work order's slot: its responsibility on its ticket (ADR 0055). */
export const WORK_ORDER_PEOPLE_QUALIFIERS = ["assignee", "follower", "involves"] as const;

/** The work order's own qualifiers. */
export const WORK_ORDER_OWN_QUALIFIERS = ["definition", "responsibility", "is"] as const;

/** Ticket qualifiers that filter work orders by their ticket, as on `ticket.list`. */
export const WORK_ORDER_TICKET_QUALIFIERS = [
  "status",
  "type",
  "customer",
  "contact",
  "when",
  "created",
  "guests",
] as const satisfies readonly TicketQualifier[];

/** Every qualifier `workOrder.list`'s `q` understands, GitHub style. */
export const WORK_ORDER_QUALIFIERS = [
  ...WORK_ORDER_PEOPLE_QUALIFIERS,
  ...WORK_ORDER_OWN_QUALIFIERS,
  ...WORK_ORDER_TICKET_QUALIFIERS,
] as const;

export type WorkOrderQualifier = (typeof WORK_ORDER_QUALIFIERS)[number];

/** `is:` values: the version's own state, or its ticket's (`open`, `closed`). */
export const WORK_ORDER_IS_VALUES = [
  "current",
  "sent",
  "unsent",
  "blocked",
  "open",
  "closed",
] as const;

export const WorkOrderListInputSchema = z.object({
  ticketId: z.string().optional().describe("Only work orders of this ticket"),
  workOrderDefinitionId: z
    .string()
    .optional()
    .describe("Only versions of this work order definition"),
  from: z.coerce.date().optional().describe("Only work orders whose ticket ends after this"),
  to: z.coerce.date().optional().describe("Only work orders whose ticket starts before this"),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe(
      "Search, GitHub style: free text matches the ticket's reference (`42`, `#42`) or title; " +
        "qualifiers filter: `involves:me` (assignee or follower of the work order's " +
        "responsibility on its ticket), `assignee:me|<member>`, `follower:me|<member>`, " +
        "`definition:<name>`, `responsibility:<name>`, `is:current|sent|unsent|blocked|open|" +
        "closed`, and the ticket's `status:`, `type:`, `customer:`, `contact:`, `when:`, " +
        "`created:`, `guests:` as on ticket.list. Prefix `-` to exclude, quote spaces, commas " +
        "for alternatives.",
    ),
  sort: z.enum(WORK_ORDER_LIST_SORTS).default("created").describe("Order by this column"),
  direction: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Page number (from 1) of `limit` work orders; returns `total`. Replaces `cursor`"),
  ...PageInputShape,
});

export type WorkOrderListInput = z.infer<typeof WorkOrderListInputSchema>;

export const WorkOrderListOutputSchema = z.object({
  items: z.array(WorkOrderSchema),
  nextCursor: z.string().nullable(),
  /** The number of matching work orders; only with `page`, else null. */
  total: z.number().int().nullable(),
});
