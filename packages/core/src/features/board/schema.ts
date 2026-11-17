import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** A column of a board (ADR 0067): a name and the order statuses it shows; only statuses have a colour. */
export const BoardPhaseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  boardId: z.string(),
  name: z.string(),
  /** Order among the board's phases (left to right). */
  position: z.number().int(),
  /** Ids of the order statuses in this phase, in status order. */
  statusIds: z.array(z.string()),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const PhaseNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .describe("Column name as staff see it, e.g. Won or Closed");

export const BoardPhaseCreateInputSchema = z.object({
  boardId: z.string().min(1),
  name: PhaseNameSchema,
  position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Index among the board's phases (0 = first); omitted places it last"),
  statusIds: z
    .array(z.string().min(1))
    .default([])
    .describe("Order statuses to show here; each leaves the phase it was in on this board"),
});

export const BoardPhaseUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: PhaseNameSchema.optional(),
});

export const BoardPhaseIdInputSchema = z.object({ id: z.string().min(1) });

export const BoardPhaseReorderInputSchema = z.object({
  boardId: z.string().min(1),
  ids: z.array(z.string().min(1)).min(1).describe("Every active phase id of the board, in order"),
});

export const BoardPhaseMoveStatusInputSchema = z.object({
  boardId: z.string().min(1),
  statusId: z.string().min(1).describe("The order status to move"),
  phaseId: z
    .string()
    .min(1)
    .nullable()
    .describe("The phase of this board to show it in; null takes it off the board"),
});

export type BoardPhaseDto = z.infer<typeof BoardPhaseSchema>;
export type BoardPhaseCreateInput = z.infer<typeof BoardPhaseCreateInputSchema>;

/** A pipeline view of orders (ADR 0067, 0111): a name, a filter, its sharing and its phases (columns). */
export const BoardViewerCanSchema = z.object({
  edit: z.boolean().describe("The caller may edit its name and columns"),
  manage: z
    .boolean()
    .describe("The caller may change its sharing or archive it (never the default view)"),
});

export const BoardSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  isDefault: z
    .boolean()
    .describe("The organization's default view: shared with everyone, configured by managers"),
  ownerId: z
    .string()
    .nullable()
    .describe("The member (user id) whose view this is; null for the default view"),
  sharedWithOrganization: z.boolean().describe("Everyone in the organization sees and edits it"),
  sharedWithUserIds: z
    .array(z.string())
    .describe("Members (user ids) it is shared with, besides its owner"),
  entityTypeId: z.string().nullable().describe("Only orders of this type; null for every type"),
  assigneeId: z
    .string()
    .nullable()
    .describe("Only orders this member (user id) is the main assignee of; null for everyone"),
  /** The board's active phases in order, each with its statuses. */
  phases: z.array(BoardPhaseSchema),
  viewerCan: BoardViewerCanSchema.describe("What the calling user or key may do with this view"),
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
  .describe("View name as staff see it, e.g. Sales or My week");

const FilterShape = {
  entityTypeId: z.string().min(1).nullable().optional().describe("Order type filter; null clears"),
  assigneeId: z.string().min(1).nullable().optional().describe("Assignee filter; null clears"),
};

export const BoardCreateInputSchema = z.object({ name: NameSchema, ...FilterShape });

export const BoardUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  ...FilterShape,
});

export const BoardIdInputSchema = z.object({ id: z.string().min(1) });

export const BoardListInputSchema = z.object(PageInputShape);

export const BoardListOutputSchema = z.object({
  items: z.array(BoardSchema),
  nextCursor: z.string().nullable(),
});

export const BoardShareInputSchema = z.object({
  id: z.string().min(1),
  organization: z.boolean().describe("Share with everyone in the organization"),
  userIds: z
    .array(z.string().min(1))
    .max(200)
    .default([])
    .describe("Members (user ids) to share with; replaces the current list, the owner is skipped"),
});

export type BoardViewerCan = z.infer<typeof BoardViewerCanSchema>;
export type BoardDto = z.infer<typeof BoardSchema>;
export type BoardCreateInput = z.infer<typeof BoardCreateInputSchema>;
export type BoardUpdateInput = z.infer<typeof BoardUpdateInputSchema>;
export type BoardShareInput = z.input<typeof BoardShareInputSchema>;
