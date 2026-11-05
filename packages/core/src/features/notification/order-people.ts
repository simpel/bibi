import type { OperationContext } from "../../operations/types";
import { effectiveFollowerIds } from "../assignment/derive-assignment";
import { listSubjectAssignments } from "../assignment/list-subject";

type Scope = { context: Pick<OperationContext, "db" | "organizationId">; orderId: string };

/**
 * Everyone who answers for or follows an order (ADR 0055): the main assignee and followers, and
 * the assignee and followers of every responsibility on it, stored or by default.
 */
export async function orderPeople({ context, orderId }: Scope): Promise<string[]> {
  const slots = await listSubjectAssignments({
    ...{ context, subjectType: "ORDER" as const, subjectId: orderId },
  });
  return slots.flatMap((assignment) => [
    ...(assignment.assigneeId ? [assignment.assigneeId] : []),
    ...effectiveFollowerIds({ assignment }),
  ]);
}

/** The order's reference and title for a notification's snapshot. */
export async function orderFacts({ context, orderId }: Scope) {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { reference: true, title: true },
  });
  return order ? { orderReference: order.reference, orderTitle: order.title } : null;
}
