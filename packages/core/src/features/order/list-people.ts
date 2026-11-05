import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { subjectIdsOf } from "../assignment/subject-filter";
import { userIdsOf } from "../assignment/user-ids-of";
import type { OrderFilter } from "./list-query";

type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

export type PeopleWhereInput = { filter: OrderFilter; context: Context };

/**
 * `assignee:` and `follower:`: orders someone answers for or follows, stored or by default
 * (the same rule as `assigneeId`/`followerId`); `-assignee:me` keeps the others.
 */
export async function peopleWhere({ filter, context }: PeopleWhereInput) {
  const kind = filter.key === "assignee" ? "ASSIGNED" : "FOLLOWING";
  const ids = new Set<string>();
  for (const value of filter.values) {
    for (const userId of await userIdsOf({ value, context })) {
      const orders = await subjectIdsOf({ context, subjectType: "ORDER", userId, kind });
      for (const id of orders) ids.add(id);
    }
  }
  const where: Prisma.OrderWhereInput = { id: { [filter.negated ? "notIn" : "in"]: [...ids] } };
  return where;
}
