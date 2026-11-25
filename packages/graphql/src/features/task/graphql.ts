import {
  archiveTask,
  completeTask,
  createTask,
  getTask,
  linkTaskOrder,
  listTasks,
  reopenTask,
  type TaskDto,
  type TaskListInput,
  TaskSchema,
  updateTask,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import type { GraphqlContext } from "../../schema/context";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { OrderRef } from "../order/graphql";

export const TaskRef = objectFromSchema<TaskDto>({
  name: "Task",
  schema: TaskSchema,
  omit: ["organizationId"],
  description:
    "Task – a site visit, tasting or deadline around a customer, before or beside an order " +
    "(ADR 0117). `type` is { id, name }; `warnings` are advisory (ITEM_BUSY).",
});
const TaskPageRef = pageType({ name: "TaskPage", item: TaskRef, withTotal: true });

fieldFromOperation({ operation: listTasks, type: TaskPageRef, name: "tasks" });
fieldFromOperation({ operation: getTask, type: TaskRef, name: "task" });
mutationFromOperation({ operation: createTask, type: TaskRef });
mutationFromOperation({ operation: updateTask, type: TaskRef });
mutationFromOperation({ operation: completeTask, type: TaskRef });
mutationFromOperation({ operation: reopenTask, type: TaskRef });
mutationFromOperation({ operation: linkTaskOrder, type: TaskRef });
mutationFromOperation({ operation: archiveTask, type: TaskRef });

type ListByInput = Pick<TaskListInput, "customerId" | "orderId"> & {
  limit: number | null | undefined;
};

/** Graph edges from the customer and the order; they read through `task.list`. */
async function listBy({ limit, ctx, ...where }: ListByInput & { ctx: GraphqlContext }) {
  const input = { ...where, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
  const page = (await runOperation({ operation: listTasks, input, ctx })) as { items: TaskDto[] };
  return page.items;
}

// Graph edges. They live here so that customer/ and order/graphql.ts need not import this.
builder.objectField(CustomerRef, "tasks", (t) =>
  t.field({
    type: [TaskRef],
    description: "The customer's tasks, by start.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: (customer, { limit }, ctx) => listBy({ customerId: customer.id, limit, ctx }),
  }),
);

builder.objectField(OrderRef, "tasks", (t) =>
  t.field({
    type: [TaskRef],
    description: "Tasks linked to the order, by start.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: (order, { limit }, ctx) => listBy({ orderId: order.id, limit, ctx }),
  }),
);
