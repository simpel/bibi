import { z } from "zod";
import { STATUS_GRID_TEMPLATE_KEYS } from "../../templates/status-grid/status-grid-templates";

/**
 * One cell of the status grid (ADR 0044): when a ticket enters `statusId`, its lines of item type
 * `entityTypeId` move to `stateId`. A cell that is not listed means "keep the state".
 */
export const StatusGridCellSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  /** A non-closing ticket status (ticketStatus.list). */
  statusId: z.string(),
  /** An item type (entityType.list base ITEM). */
  entityTypeId: z.string(),
  /** A state of that item type (itemState.list). */
  stateId: z.string(),
  /** Names for display (status, item type, state) and the state's color. */
  statusName: z.string(),
  entityTypeName: z.string(),
  stateName: z.string(),
  stateColor: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

/**
 * The status grid: statuses × item types, only the cells that are set. Bounded by the
 * organization's statuses and item types (a handful each), so it is never paged.
 */
export const StatusGridSchema = z.object({ cells: z.array(StatusGridCellSchema) });

export const StatusGridGetInputSchema = z.object({
  statusId: z
    .string()
    .min(1)
    .optional()
    .describe("Only the cells of this status (ticketStatus.list)"),
});

export const StatusGridSetCellInputSchema = z.object({
  statusId: z.string().min(1).describe("Id of a non-closing ticket status (ticketStatus.list)"),
  entityTypeId: z.string().min(1).describe("Id of an item type (entityType.list base ITEM)"),
  stateId: z
    .string()
    .min(1)
    .nullable()
    .describe(
      "Id of a state of that item type (itemState.list) the lines move to on entering the " +
        'status; null clears the cell ("keep the state")',
    ),
});

export const StatusGridImportTemplateInputSchema = z.object({
  template: z
    .enum(STATUS_GRID_TEMPLATE_KEYS)
    .describe(
      "default: the open default statuses set the one state every type has. conference-estate: " +
        "prebooked, estimated and planned until Confirmed, then booked, ordered and confirmed, " +
        "and locked food at Final count locked. Matched by state name",
    ),
});

export const StatusGridImportTemplateOutputSchema = z.object({
  /** Cells this import set; cells that were already set are kept. */
  applied: z.number().int(),
  /** The whole grid afterwards. */
  grid: StatusGridSchema,
});

export type StatusGridCellDto = z.infer<typeof StatusGridCellSchema>;
export type StatusGridDto = z.infer<typeof StatusGridSchema>;
export type StatusGridSetCellInput = z.infer<typeof StatusGridSetCellInputSchema>;
export type StatusGridImportTemplateOutput = z.infer<typeof StatusGridImportTemplateOutputSchema>;
