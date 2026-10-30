import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { TICKET_STATUS_TEMPLATE_KEYS } from "../../templates/ticket-statuses/ticket-status-templates";

/** The generic status flags (ADR 0043): the only behaviour a status has. */
export const STATUS_FLAGS = [
  "entry",
  "closes",
  "requiresReason",
  "requiresAssignee",
  "requiresAcceptedQuote",
  "invoiceable",
] as const;
export type StatusFlag = (typeof STATUS_FLAGS)[number];

/** The quote events that can move a ticket into a status (ADR 0043). */
export const STATUS_EVENTS = ["QUOTE_SENT", "QUOTE_ACCEPTED"] as const;
export const StatusEventSchema = z.enum(STATUS_EVENTS);
export type StatusEvent = z.infer<typeof StatusEventSchema>;

const EventSchema = StatusEventSchema.nullable().describe(
  "Quote event that moves tickets into this status (QUOTE_SENT or QUOTE_ACCEPTED); null for none. " +
    "At most one status per event; a status with an event is not entered by hand",
);

const FlagShape = {
  entry: z
    .boolean()
    .describe("New tickets start here; the first active entry status is the default"),
  closes: z.boolean().describe("No move leaves this status; entering it releases every line"),
  requiresReason: z.boolean().describe("A reason is required to enter (lost, cancelled, reopened)"),
  requiresAssignee: z.boolean().describe("The ticket must have its main assignee to enter"),
  requiresAcceptedQuote: z
    .boolean()
    .describe("The ticket must have an accepted quote to enter (the status guards the fact)"),
  invoiceable: z.boolean().describe("Invoices can be created in this status"),
};

export const TicketStatusSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  color: z.string(),
  /** Order among the organization's statuses (left to right on the board). */
  position: z.number().int(),
  ...FlagShape,
  event: EventSchema,
  /** Ids of the statuses a ticket may move to from this one (ADR 0043). */
  transitionsTo: z.array(z.string()),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .describe("Status name as staff see it, e.g. Lead, Quote sent or Lost");

export const ColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #22c55e")
  .describe("Hex color, e.g. #22c55e");

const OptionalFlags = z.object({ ...FlagShape, event: EventSchema }).partial().shape;

export const TicketStatusCreateInputSchema = z.object({
  name: NameSchema,
  color: ColorSchema,
  ...OptionalFlags,
  phaseId: z
    .string()
    .min(1)
    .optional()
    .describe("Board phase to show it in; omitted leaves it on no board until moved onto one"),
});

export const TicketStatusUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  color: ColorSchema.optional(),
  ...OptionalFlags,
});

export const TicketStatusIdInputSchema = z.object({ id: z.string().min(1) });

export const TicketStatusArchiveInputSchema = z.object({
  id: z.string().min(1),
  targetStatusId: z
    .string()
    .min(1)
    .optional()
    .describe("Where the status's tickets move; required when the status holds tickets"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Reason for the moved tickets; required when the target status requires one"),
});

export const TicketStatusListInputSchema = z.object(PageInputShape);

export const TicketStatusListOutputSchema = z.object({
  items: z.array(TicketStatusSchema),
  nextCursor: z.string().nullable(),
});

export const TicketStatusReorderInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe("Every active status id, in the new order"),
});

export const TicketStatusSetTransitionsInputSchema = z.object({
  id: z.string().min(1).describe("The status the transitions start from"),
  toStatusIds: z
    .array(z.string().min(1))
    .describe("Every status a ticket may move to from this one; replaces the current set"),
});

export const TicketStatusImportTemplateInputSchema = z.object({
  template: z
    .enum(TICKET_STATUS_TEMPLATE_KEYS)
    .describe(
      "default: Lead, Confirmed, Completed, Lost. conference-estate: New, Site visit, Quote sent, " +
        "Confirmed, Final count locked, Completed, Lost, Cancelled. Every move forward and to a " +
        "closing status",
    ),
});

export const TicketStatusImportTemplateOutputSchema = z.object({
  /** Statuses created by this import. */
  created: z.array(TicketStatusSchema),
  /** Names that already existed and were left untouched. */
  skipped: z.array(z.string()),
  /** Transitions added between the template's statuses (existing ones are kept). */
  transitionsAdded: z.number().int(),
});

export type TicketStatusDto = z.infer<typeof TicketStatusSchema>;
export type TicketStatusFlags = Pick<TicketStatusDto, StatusFlag>;
export type TicketStatusCreateInput = z.infer<typeof TicketStatusCreateInputSchema>;
export type TicketStatusUpdateInput = z.infer<typeof TicketStatusUpdateInputSchema>;
export type TicketStatusArchiveInput = z.infer<typeof TicketStatusArchiveInputSchema>;
export type TicketStatusImportResult = z.infer<typeof TicketStatusImportTemplateOutputSchema>;
