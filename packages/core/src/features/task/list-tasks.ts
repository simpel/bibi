import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { nowOf } from "../../time/now";
import { subjectIdFilter } from "../assignment/subject-filter";
import type { TaskListInput } from "./schema";
import { TASK_INCLUDE, toTaskDtos } from "./to-task-dto";

type Context = Pick<OperationContext, "db" | "permissions" | "now">;

/** Open and due before `now`; a task without a due time is never overdue (ADR 0120). */
const overdueWhere = ({ now }: { now: Date }): Prisma.TaskWhereInput => ({
  doneAt: null,
  dueAt: { lt: now },
});

const STATE_WHERE = {
  open: () => ({ doneAt: null }),
  done: () => ({ doneAt: { not: null } }),
  overdue: overdueWhere,
} satisfies Record<
  NonNullable<TaskListInput["state"]>,
  (i: { now: Date }) => Prisma.TaskWhereInput
>;

/** The filters of `task.list`; `from`/`to` keep tasks due in the window (none without a due time). */
function taskWhere({ input, now }: { input: TaskListInput; now: Date }): Prisma.TaskWhereInput {
  const { customerId, orderId, state, from, to } = input;
  return {
    AND: [
      customerId ? { customerId } : {},
      orderId ? { orderId } : {},
      state ? STATE_WHERE[state]({ now }) : {},
      to ? { dueAt: { lt: to } } : {},
      from ? { dueAt: { gte: from } } : {},
    ],
  };
}

/** Prisma paging: `skip` for a numbered `page`, else the cursor (one extra row = more pages). */
function pagingArgs({ input }: { input: TaskListInput }) {
  const { limit, cursor, page } = input;
  return page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
}

/** One page of `task.list`, by due time (none last); with `page` it also counts the matches (`total`). */
export async function loadTaskPage({ context, input }: { context: Context; input: TaskListInput }) {
  const ids = await subjectIdFilter({ context, subjectType: "TASK", assigneeId: input.assigneeId });
  const where = { AND: [taskWhere({ input, now: nowOf({ context }) }), ids] };
  const [rows, total] = await Promise.all([
    context.db.task.findMany({
      where,
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      ...pagingArgs({ input }),
      include: TASK_INCLUDE,
    }),
    input.page ? context.db.task.count({ where }) : Promise.resolve(null),
  ]);
  const page = paginate({ rows, limit: input.limit });
  return {
    items: await toTaskDtos({ context, rows: page.items }),
    nextCursor: page.nextCursor,
    total,
  };
}
