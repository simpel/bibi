import type { OperationContext } from "../../operations/types";
import { type ChoiceRow, deriveAssignment, type SlotDefaults } from "./derive-assignment";
import type { AssignmentDto, AssignmentSlot } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };
type SlotContext = { context: Pick<OperationContext, "db" | "organizationId"> };

/** Followers in the order they chose, and the record's base (the subject type). */
export const ASSIGNMENT_INCLUDE = {
  record: { select: { base: true } },
  followers: {
    select: { userId: true, effect: true },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

export type AssignmentRow = ChoiceRow & { record: { base: string } };

/** The stored choice and the responsibility's defaults for one slot (ADR 0055). */
export type SlotState = { row: AssignmentRow | null; defaults: SlotDefaults | null };

/** The defaults of the active responsibilities among `responsibilityIds`, by id. */
export async function loadDefaults({
  context,
  responsibilityIds,
}: Db & { responsibilityIds: readonly string[] }): Promise<Map<string, SlotDefaults>> {
  if (responsibilityIds.length === 0) return new Map();
  const rows = await context.db.responsibility.findMany({
    where: { id: { in: [...responsibilityIds] } },
    select: {
      id: true,
      defaultAssigneeId: true,
      defaultFollowers: { select: { userId: true }, orderBy: { position: "asc" } },
    },
  });
  const defaults = rows.map((row) => [
    row.id,
    { assigneeId: row.defaultAssigneeId, followerIds: row.defaultFollowers.map((f) => f.userId) },
  ]);
  return new Map(defaults as [string, SlotDefaults][]);
}

/**
 * The slot's stored choice, archived ones included (they are reactivated on write), and its
 * responsibility's defaults. A responsibility that is archived or unknown has none.
 */
export async function loadSlotState({
  context,
  subjectId,
  responsibilityId,
}: Db & AssignmentSlot): Promise<SlotState> {
  const row = await context.db.assignment.findFirst({
    where: {
      recordId: subjectId,
      responsibilityId: responsibilityId ?? null,
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    include: ASSIGNMENT_INCLUDE,
  });
  const defaults = responsibilityId
    ? ((await loadDefaults({ context, responsibilityIds: [responsibilityId] })).get(
        responsibilityId,
      ) ?? null)
    : null;
  return { row, defaults };
}

export type SlotDtoInput = SlotContext & AssignmentSlot & SlotState;

/** The derived assignment of a slot (ADR 0055). */
export const toSlotDto = ({ context, row, defaults, ...slot }: SlotDtoInput): AssignmentDto =>
  deriveAssignment({
    organizationId: context.organizationId,
    ...slot,
    responsibilityId: slot.responsibilityId ?? null,
    row,
    defaults,
  });

/** The derived assignment of a slot, loaded fresh. */
export async function loadSlot({
  context,
  ...slot
}: SlotContext & AssignmentSlot): Promise<AssignmentDto> {
  return toSlotDto({ context, ...slot, ...(await loadSlotState({ context, ...slot })) });
}

/** The main assignee (user id) of a subject, or null when nobody is assigned. */
export async function mainAssigneeId({
  context,
  subjectId,
}: Db & Omit<AssignmentSlot, "responsibilityId">): Promise<string | null> {
  const row = await context.db.assignment.findFirst({
    where: { recordId: subjectId, responsibilityId: null },
    select: { assigneeId: true },
  });
  return row?.assigneeId ?? null;
}
