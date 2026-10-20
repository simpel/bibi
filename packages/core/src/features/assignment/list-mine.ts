import type { OperationContext } from "../../operations/types";
import { deriveAssignment } from "./derive-assignment";
import { derivedSlots } from "./derived-membership";
import { ASSIGNMENT_INCLUDE, loadDefaults } from "./load-assignment";
import {
  type AssignmentDto,
  type AssignmentKind,
  type AssignmentSubjectType,
  AssignmentSubjectTypeSchema,
} from "./schema";

export type MineQuery = {
  context: Pick<OperationContext, "db" | "organizationId">;
  userId: string;
  kind: AssignmentKind;
  subjectType?: AssignmentSubjectType | undefined;
};

export type ListMineInput = MineQuery & { limit: number; cursor?: string | undefined };

type Slot = { subjectId: string; responsibilityId: string | null; at: Date };

/** The page cursor and the order key of a slot: one per subject and responsibility. */
export const slotKey = ({ subjectId, responsibilityId }: Omit<Slot, "at">) =>
  `${subjectId}:${responsibilityId ?? ""}`;

/** The slots the member chose explicitly (stored rows) and those their defaults give them. */
async function candidateSlots({ context, userId, kind, subjectType }: MineQuery) {
  const mine =
    kind === "ASSIGNED"
      ? { assigneeId: userId }
      : { followers: { some: { userId, effect: "FOLLOW" as const } } };
  const rows = await context.db.assignment.findMany({
    where: { ...mine, ...(subjectType ? { record: { base: subjectType } } : {}) },
    select: { recordId: true, responsibilityId: true, createdAt: true },
  });
  const slots: Slot[] = rows.map((r) => ({
    subjectId: r.recordId,
    responsibilityId: r.responsibilityId,
    at: r.createdAt,
  }));
  if (subjectType === "ITEM") return slots;
  const derived = await derivedSlots({ context, userId, kind });
  const tickets = await context.db.ticket.findMany({
    where: { id: { in: derived.map((slot) => slot.ticketId) } },
    select: { id: true, createdAt: true },
  });
  const createdAt = new Map(tickets.map((ticket) => [ticket.id, ticket.createdAt]));
  for (const { ticketId, responsibilityId } of derived) {
    const at = createdAt.get(ticketId);
    if (at) slots.push({ subjectId: ticketId, responsibilityId, at });
  }
  return slots;
}

/** Newest first, then by key; one entry per slot. */
function ordered({ slots }: { slots: Slot[] }) {
  const unique = new Map(slots.map((slot) => [slotKey(slot), slot]));
  return [...unique.entries()].sort(
    ([ka, a], [kb, b]) => b.at.getTime() - a.at.getTime() || (ka < kb ? 1 : -1),
  );
}

/** The derived assignments of the slots (ADR 0055), in the given order. */
async function hydrate({
  context,
  slots,
}: Pick<ListMineInput, "context"> & { slots: Slot[] }): Promise<AssignmentDto[]> {
  const rows = await context.db.assignment.findMany({
    where: { recordId: { in: slots.map((slot) => slot.subjectId) } },
    include: ASSIGNMENT_INCLUDE,
  });
  const defaults = await loadDefaults({
    context,
    responsibilityIds: slots.flatMap((slot) => slot.responsibilityId ?? []),
  });
  return slots.map(({ subjectId, responsibilityId }) => {
    const row =
      rows.find((r) => r.recordId === subjectId && r.responsibilityId === responsibilityId) ?? null;
    return deriveAssignment({
      organizationId: context.organizationId,
      subjectType: AssignmentSubjectTypeSchema.parse(row?.record.base ?? "TICKET"),
      subjectId,
      responsibilityId,
      row,
      defaults: responsibilityId ? (defaults.get(responsibilityId) ?? null) : null,
    });
  });
}

/**
 * The member's assignments, newest first (ADR 0055): stored choices plus what their
 * responsibilities' defaults give them on tickets. The cursor is the key of the last slot.
 */
export async function listMineAssignments({ cursor, limit, ...query }: ListMineInput) {
  const all = ordered({ slots: await candidateSlots(query) });
  const start = cursor ? all.findIndex(([key]) => key === cursor) + 1 : 0;
  const page = all.slice(start, start + limit);
  const items = await hydrate({ context: query.context, slots: page.map(([, slot]) => slot) });
  const last = page.at(-1);
  const more = start + limit < all.length;
  return { items, nextCursor: more && last ? last[0] : null };
}
