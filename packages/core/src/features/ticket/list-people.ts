import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { subjectIdsOf } from "../assignment/subject-filter";
import { userIdsOf } from "../assignment/user-ids-of";
import type { TicketFilter } from "./list-query";

type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

export type PeopleWhereInput = { filter: TicketFilter; context: Context };

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
