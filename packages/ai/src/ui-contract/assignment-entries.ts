import { AssignmentSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of an assignment as tool results carry it (dates = ISO strings). */
export const AssignmentWireSchema = AssignmentSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});
/** `assignment_list` has no cursor; `assignment_listMine` has one. */
export const AssignmentListWireSchema = z.object({
  items: z.array(AssignmentWireSchema),
  nextCursor: z.string().nullable().optional(),
});

export type AssignmentWire = z.infer<typeof AssignmentWireSchema>;

const assignmentTable = uiEntry({
  component: "assignment-table",
  schema: AssignmentListWireSchema,
  toProps: ({ value }) => ({ items: value.items, nextCursor: value.nextCursor ?? null }),
});
const assignmentCard = uiEntry({
  component: "assignment-card",
  schema: AssignmentWireSchema,
  toProps: ({ value }) => ({ assignment: value }),
});

/** Tool → component for who answers for and follows inquiries, bookings and items (ADR 0034). */
export const ASSIGNMENT_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  assignment_list: assignmentTable,
  assignment_listMine: assignmentTable,
  assignment_assign: assignmentCard,
  assignment_follow: assignmentCard,
  assignment_unfollow: assignmentCard,
};
