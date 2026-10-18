import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { TICKET_PHASE_TEMPLATE_KEYS } from "../../templates/ticket-phases/ticket-phase-templates";

/** The generic phase flags (ADR 0043): the only behaviour a phase has. */
export const PHASE_FLAGS = [
  "entry",
  "terminal",
  "requiresReason",
  "requiresAssignee",
  "invoiceable",
] as const;
export type PhaseFlag = (typeof PHASE_FLAGS)[number];

const FlagShape = {
  entry: z
    .boolean()
    .describe("New tickets start here; the first active entry phase is the default"),
  terminal: z.boolean().describe("No move leaves this phase; entering it releases every line"),
  requiresReason: z.boolean().describe("A reason is required to enter (lost, cancelled, reopened)"),
  requiresAssignee: z.boolean().describe("The ticket must have its main assignee to enter"),
  invoiceable: z.boolean().describe("Invoices can be created in this phase"),
};

export const TicketPhaseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  color: z.string(),
  /** Order among the organization's phases (left to right on the board). */
  position: z.number().int(),
  ...FlagShape,
  /** Ids of the phases a ticket may move to from this one (ADR 0043). */
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
  .describe("Phase name as staff see it, e.g. Lead, Quote sent or Lost");

const ColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #22c55e")
  .describe("Hex color, e.g. #22c55e");

const OptionalFlags = z.object(FlagShape).partial().shape;

export const TicketPhaseCreateInputSchema = z.object({
  name: NameSchema,
  color: ColorSchema,
  ...OptionalFlags,
});

export const TicketPhaseUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  color: ColorSchema.optional(),
  ...OptionalFlags,
});

export const TicketPhaseIdInputSchema = z.object({ id: z.string().min(1) });

export const TicketPhaseArchiveInputSchema = z.object({
  id: z.string().min(1),
  targetPhaseId: z
    .string()
    .min(1)
    .optional()
    .describe("Where the phase's tickets move; required when the phase holds tickets"),
  reason: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("Reason for the moved tickets; required when the target phase requires one"),
});

export const TicketPhaseListInputSchema = z.object(PageInputShape);

export const TicketPhaseListOutputSchema = z.object({
  items: z.array(TicketPhaseSchema),
  nextCursor: z.string().nullable(),
});

export const TicketPhaseReorderInputSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe("Every active phase id, in the new order"),
});

export const TicketPhaseSetTransitionsInputSchema = z.object({
  id: z.string().min(1).describe("The phase the transitions start from"),
  toPhaseIds: z
    .array(z.string().min(1))
    .describe("Every phase a ticket may move to from this one; replaces the current set"),
});

export const TicketPhaseImportTemplateInputSchema = z.object({
  template: z
    .enum(TICKET_PHASE_TEMPLATE_KEYS)
    .describe(
      "default: Lead, Confirmed, Completed, Lost. conference-estate: New, Site visit, Quote sent, " +
        "Confirmed, Final count locked, Completed, Lost, Cancelled. Every move forward and to a " +
        "terminal phase",
    ),
});

export const TicketPhaseImportTemplateOutputSchema = z.object({
  /** Phases created by this import. */
  created: z.array(TicketPhaseSchema),
  /** Names that already existed and were left untouched. */
  skipped: z.array(z.string()),
  /** Transitions added between the template's phases (existing ones are kept). */
  transitionsAdded: z.number().int(),
});

export type TicketPhaseDto = z.infer<typeof TicketPhaseSchema>;
export type TicketPhaseFlags = Pick<TicketPhaseDto, PhaseFlag>;
export type TicketPhaseCreateInput = z.infer<typeof TicketPhaseCreateInputSchema>;
export type TicketPhaseUpdateInput = z.infer<typeof TicketPhaseUpdateInputSchema>;
export type TicketPhaseArchiveInput = z.infer<typeof TicketPhaseArchiveInputSchema>;
export type TicketPhaseImportResult = z.infer<typeof TicketPhaseImportTemplateOutputSchema>;
