import { z } from "zod";
import { ItemCapabilitiesSchema } from "../entity-type/capability-kinds";
import { HoldKindSchema } from "../item-state/hold-kind";
import { ItemStateSchema } from "../item-state/schema";
import { StatusGridSchema } from "../status-grid/schema";
import { ColorSchema, TicketStatusSchema } from "../ticket-status/schema";

const name = ({ max, example }: { max: number; example: string }) =>
  z.string().trim().min(1).max(max).describe(example);

/** One state of an item type in the draft (ADR 0044); flags default to off. */
export const PipelineStateDraftSchema = z.object({
  name: name({ max: 64, example: "State name, e.g. Prebooked, Booked or Ordered" }),
  color: ColorSchema,
  initial: z.boolean().optional().describe("New lines start here; exactly one per type"),
  hold: HoldKindSchema.optional().describe("NONE, SOFT or HARD; SOFT and HARD only if bookable"),
  inSheets: z.boolean().optional().describe("Lines in this state are included in sheets"),
  released: z.boolean().optional().describe("Final state: the hold is dropped"),
  expires: z.boolean().optional().describe("Falls to the expiry state when holdsUntil passes"),
});

/** One item type in the draft: an existing type (`entityTypeId`) or a new one (`capabilities`). */
export const PipelineTypeDraftSchema = z.object({
  entityTypeId: z
    .string()
    .min(1)
    .optional()
    .describe("Id of an existing item type (entityType.list base ITEM); omit for a new type"),
  name: name({ max: 100, example: "Item type name, e.g. Conference room or Dish" }),
  capabilities: ItemCapabilitiesSchema.optional().describe(
    "New types only; an existing type keeps its own capabilities",
  ),
  states: z.array(PipelineStateDraftSchema).min(1).max(20).describe("The type's states, in order"),
  expiryState: z
    .string()
    .nullable()
    .optional()
    .describe("Name of the state lines in an expiring state fall to; null for none"),
});

/** One ticket status in the draft (ADR 0043); flags default to off. */
export const PipelineStatusDraftSchema = z.object({
  name: name({ max: 64, example: "Status name, e.g. Lead, Quote sent or Lost" }),
  color: ColorSchema,
  entry: z.boolean().optional().describe("New tickets start here; exactly one status"),
  closes: z.boolean().optional().describe("Ends the ticket; entering it releases every line"),
  requiresReason: z.boolean().optional().describe("A reason is required to enter"),
  requiresAssignee: z.boolean().optional().describe("The ticket needs its assignee to enter"),
  requiresAcceptedQuote: z
    .boolean()
    .optional()
    .describe("The ticket needs an accepted quote to enter"),
  invoiceable: z.boolean().optional().describe("Invoices can be created in this status"),
  event: TicketStatusSchema.shape.event.optional(),
});

/** One grid cell by name: entering `status` moves the lines of `type` to `state`. */
export const PipelineCellDraftSchema = z.object({
  ticketStatus: z.string().min(1).describe("Name of a non-closing status of the draft"),
  type: z.string().min(1).describe("Name of an item type of the draft"),
  state: z.string().min(1).describe("Name of a state of that type"),
});

/**
 * A whole pipeline (ADR 0044's guided setup): item types with their states, statuses in order and
 * the grid. Everything is matched by name, so the assistant can propose one from a description.
 * Transitions are the defaults: every forward move and a move to any closing or released one.
 */
export const PipelineSetupDraftSchema = z.object({
  itemTypes: z.array(PipelineTypeDraftSchema).max(20).describe("The item types to set up"),
  statuses: z.array(PipelineStatusDraftSchema).min(1).max(30).describe("The statuses, in order"),
  cells: z
    .array(PipelineCellDraftSchema)
    .max(600)
    .describe("The set grid cells; a missing cell keeps the line's state"),
});

export const PIPELINE_PROBLEM_CODES = [
  "NO_ENTRY_STATUS",
  "MANY_ENTRY_STATUSES",
  "NO_CLOSING_STATUS",
  "INVALID_STATUS_FLAGS",
  "DUPLICATE_NAME",
  "NO_INITIAL_STATE",
  "MANY_INITIAL_STATES",
  "INVALID_STATE_FLAGS",
  "UNKNOWN_EXPIRY_STATE",
  "UNKNOWN_CELL",
  "CLOSING_CELL",
  "STATE_CANNOT_LEAVE",
  "LINE_BLOCKED",
] as const;

/** A configuration problem; `error` blocks activation, `warning` does not. */
export const PipelineProblemSchema = z.object({
  code: z.enum(PIPELINE_PROBLEM_CODES),
  severity: z.enum(["error", "warning"]),
  message: z.string(),
  ticketStatus: z.string().nullable(),
  type: z.string().nullable(),
  state: z.string().nullable(),
});

/** One line of the simulated ticket in one status. */
export const PipelinePreviewLineSchema = z.object({
  type: z.string(),
  /** The line's state; null when the type has no usable state. */
  state: z.string().nullable(),
  color: z.string().nullable(),
  hold: HoldKindSchema,
  released: z.boolean(),
  /** The line moved to another state on entering the status. */
  changed: z.boolean(),
  /** Why the line could not move as the grid says; it keeps its state. */
  blocked: z.string().nullable(),
});

/** The simulated ticket after entering one status. */
export const PipelinePreviewStepSchema = z.object({
  ticketStatus: z.string(),
  color: z.string(),
  closes: z.boolean(),
  lines: z.array(PipelinePreviewLineSchema),
});

export const PipelinePreviewSchema = z.object({
  /** True when no problem is an error: the draft can be activated. */
  ready: z.boolean(),
  problems: z.array(PipelineProblemSchema),
  /** Open statuses in order, then each closing status entered from the last open one. */
  steps: z.array(PipelinePreviewStepSchema),
});

export const PipelineActivateOutputSchema = z.object({
  statuses: z.array(TicketStatusSchema),
  states: z.array(ItemStateSchema),
  grid: StatusGridSchema,
});

export type PipelineStateDraft = z.infer<typeof PipelineStateDraftSchema>;
export type PipelineTypeDraft = z.infer<typeof PipelineTypeDraftSchema>;
export type PipelineStatusDraft = z.infer<typeof PipelineStatusDraftSchema>;
export type PipelineCellDraft = z.infer<typeof PipelineCellDraftSchema>;
export type PipelineSetupDraft = z.infer<typeof PipelineSetupDraftSchema>;
export type PipelineProblem = z.infer<typeof PipelineProblemSchema>;
export type PipelinePreviewLine = z.infer<typeof PipelinePreviewLineSchema>;
export type PipelinePreviewStep = z.infer<typeof PipelinePreviewStepSchema>;
export type PipelinePreview = z.infer<typeof PipelinePreviewSchema>;
export type PipelineActivateOutput = z.infer<typeof PipelineActivateOutputSchema>;
