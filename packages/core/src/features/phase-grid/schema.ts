import { z } from "zod";
import { PHASE_GRID_TEMPLATE_KEYS } from "../../templates/phase-grid/phase-grid-templates";

/**
 * One cell of the phase grid (ADR 0044): when a ticket enters `phaseId`, its lines of item type
 * `entityTypeId` move to `stateId`. A cell that is not listed means "keep the state".
 */
export const PhaseGridCellSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** A non-terminal ticket phase (ticketPhase.list). */
  phaseId: z.string(),
  /** An item type (entityType.list base ITEM). */
  entityTypeId: z.string(),
  /** A state of that item type (itemState.list). */
  stateId: z.string(),
  /** Names for display (phase, item type, state) and the state's color. */
  phaseName: z.string(),
  entityTypeName: z.string(),
  stateName: z.string(),
  stateColor: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

/**
 * The phase grid: phases × item types, only the cells that are set. Bounded by the
 * organization's phases and item types (a handful each), so it is never paged.
 */
export const PhaseGridSchema = z.object({ cells: z.array(PhaseGridCellSchema) });

export const PhaseGridGetInputSchema = z.object({
  phaseId: z.string().min(1).optional().describe("Only the cells of this phase (ticketPhase.list)"),
});

export const PhaseGridSetCellInputSchema = z.object({
  phaseId: z.string().min(1).describe("Id of a non-terminal ticket phase (ticketPhase.list)"),
  entityTypeId: z.string().min(1).describe("Id of an item type (entityType.list base ITEM)"),
  stateId: z
    .string()
    .min(1)
    .nullable()
    .describe(
      "Id of a state of that item type (itemState.list) the lines move to on entering the " +
        'phase; null clears the cell ("keep the state")',
    ),
});

export const PhaseGridImportTemplateInputSchema = z.object({
  template: z
    .enum(PHASE_GRID_TEMPLATE_KEYS)
    .describe(
      "default: the open default phases set the one state every type has. conference-estate: " +
        "prebooked, estimated and planned until Confirmed, then booked, ordered and confirmed, " +
        "and locked food at Final count locked. Matched by state name",
    ),
});

export const PhaseGridImportTemplateOutputSchema = z.object({
  /** Cells this import set; cells that were already set are kept. */
  applied: z.number().int(),
  /** The whole grid afterwards. */
  grid: PhaseGridSchema,
});

export type PhaseGridCellDto = z.infer<typeof PhaseGridCellSchema>;
export type PhaseGridDto = z.infer<typeof PhaseGridSchema>;
export type PhaseGridSetCellInput = z.infer<typeof PhaseGridSetCellInputSchema>;
export type PhaseGridImportTemplateOutput = z.infer<typeof PhaseGridImportTemplateOutputSchema>;
