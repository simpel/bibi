import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { subjectIdsOf } from "../assignment/subject-filter";
import type { TicketFilter } from "./list-query";

type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

export type PeopleWhereInput = { filter: TicketFilter; context: Context };

/**
 * Users a value names: `me` is the caller; any other value is a member whose name contains it,
 * only for callers who may view members (ADR 0071), else nobody.
 */
async function userIdsOf({ value, context }: { value: string; context: Context }) {
  if (value.toLowerCase() === "me") return context.actor.userId ? [context.actor.userId] : [];
  if (!canView({ context, feature: "member" })) return [];
  const members = await context.db.member.findMany({
    where: { user: { name: { contains: value, mode: "insensitive" } } },
    select: { userId: true },
  });
  return members.map((member) => member.userId);
}

/**
 * `assignee:` and `follower:`: tickets someone answers for or follows, stored or by default
 * (the same rule as `assigneeId`/`followerId`); `-assignee:me` keeps the others.
 */
export async function peopleWhere({ filter, context }: PeopleWhereInput) {
  const kind = filter.key === "assignee" ? "ASSIGNED" : "FOLLOWING";
  const ids = new Set<string>();
  for (const value of filter.values) {
    for (const userId of await userIdsOf({ value, context })) {
      const tickets = await subjectIdsOf({ context, subjectType: "TICKET", userId, kind });
      for (const id of tickets) ids.add(id);
    }
  }
  const where: Prisma.TicketWhereInput = { id: { [filter.negated ? "notIn" : "in"]: [...ids] } };
  return where;
}
