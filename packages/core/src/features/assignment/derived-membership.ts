import type { OperationContext } from "../../operations/types";
import type { AssignmentKind } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type DerivedSlot = { ticketId: string; responsibilityId: string };

export type DerivedSlotsInput = Db & { userId: string; kind: AssignmentKind };

/** The active responsibilities that default to the member, as assignee or as follower. */
function defaultedTo({ context, userId, kind }: DerivedSlotsInput) {
  return context.db.responsibility.findMany({
    where:
      kind === "ASSIGNED"
        ? { defaultAssigneeId: userId }
        : { defaultFollowers: { some: { userId } } },
    select: { id: true, entityTypes: { select: { entityTypeId: true } } },
  });
}

/** Tickets with an active line whose item is of one of the types. */
async function ticketsCovering({ context, types }: Db & { types: string[] }) {
  if (types.length === 0) return [];
  const lines = await context.db.line.findMany({
    where: { status: "ACTIVE", item: { entityTypeId: { in: types } } },
    select: { ticketId: true },
    distinct: ["ticketId"],
  });
  return lines.map((line) => line.ticketId);
}

/**
 * The (ticket, responsibility) slots the member gets from the responsibilities' defaults (ADR
 * 0055): the ticket has a line the responsibility covers, and nobody chose otherwise on it. For
 * `ASSIGNED` an explicit assignee replaces the default; for `FOLLOWING` an explicit unfollow of
 * the member removes it.
 */
export async function derivedSlots({
  context,
  userId,
  kind,
}: DerivedSlotsInput): Promise<DerivedSlot[]> {
  const slots: DerivedSlot[] = [];
  for (const responsibility of await defaultedTo({ context, userId, kind })) {
    const types = responsibility.entityTypes.map((type) => type.entityTypeId);
    const ticketIds = await ticketsCovering({ context, types });
    const choices = await context.db.assignment.findMany({
      where: { recordId: { in: ticketIds }, responsibilityId: responsibility.id },
      select: {
        recordId: true,
        assigneeId: true,
        followers: { select: { userId: true, effect: true } },
      },
    });
    const overridden = new Set(
      choices
        .filter((choice) =>
          kind === "ASSIGNED"
            ? choice.assigneeId !== null
            : choice.followers.some((f) => f.userId === userId && f.effect === "UNFOLLOW"),
        )
        .map((choice) => choice.recordId),
    );
    for (const ticketId of ticketIds) {
      if (!overridden.has(ticketId)) slots.push({ ticketId, responsibilityId: responsibility.id });
    }
  }
  return slots;
}
