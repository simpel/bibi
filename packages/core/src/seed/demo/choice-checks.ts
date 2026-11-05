import { listSubjectAssignments } from "../../features/assignment/list-subject";
import type { AssignmentDto } from "../../features/assignment/schema";
import type { ExecuteContext } from "../../operations/context";
import type { DemoOrder } from "./order-types";
import type { DemoOrg } from "./types";

export type CheckDemoChoicesInput = { context: ExecuteContext; org: DemoOrg };

type Names = ReadonlyMap<string, string>;
type PartInput = {
  org: DemoOrg;
  order: DemoOrder;
  part: AssignmentDto;
  names: Names;
  responsibility: string;
};

/** Compares one derived responsibility part with the defaults plus the order's choices. */
function partFailures({ org, order, part, names, responsibility }: PartInput) {
  const spec = org.responsibilities.find((row) => row.name === responsibility);
  const choice = order.choices?.find((row) => row.responsibility === responsibility);
  if (!spec) return [`${org.slug}: unknown responsibility ${responsibility}`];
  const name = ({ id }: { id: string | null }) => (id ? (names.get(id) ?? id) : null);
  const expected = {
    assignee: choice?.assignee ?? spec.assignee,
    source: choice?.assignee ? "EXPLICIT" : "DEFAULT",
    followers: (spec.followers ?? []).filter((follower) => follower !== choice?.unfollow),
  };
  const actual = {
    assignee: name({ id: part.assigneeId }),
    source: part.assigneeSource,
    followers: part.followers.map(({ userId }) => name({ id: userId })),
  };
  if (JSON.stringify(actual) === JSON.stringify(expected)) return [];
  return [
    `${org.slug}: ${order.ref} ${responsibility} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
  ];
}

/**
 * ADR 0055: only the data files' explicit choices are stored for responsibilities. On every seeded
 * order with lines the derived assignee and followers equal the responsibility's defaults, except
 * the order's choices: an explicit assignee, and a default follower who left.
 */
export async function checkDemoChoices({ context, org }: CheckDemoChoicesInput): Promise<string[]> {
  const members = await context.db.member.findMany({
    select: { userId: true, user: { select: { name: true } } },
  });
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  const rows = await context.db.responsibility.findMany({ select: { id: true, name: true } });
  const responsibilityName = new Map(rows.map((row) => [row.id, row.name]));
  const stored = await context.db.assignment.count({ where: { responsibilityId: { not: null } } });
  const expectedStored = org.orders.reduce(
    (sum, order) => sum + (order.choices?.length ?? 0),
    0,
  );
  const failures =
    stored === expectedStored
      ? []
      : [`${org.slug}: ${stored} stored responsibility choices, expected ${expectedStored}`];
  const dbOrders = await context.db.order.findMany({
    where: { organizationId: context.organizationId },
    select: { id: true, reference: true },
  });
  const orderIdByRef = new Map(dbOrders.map((row) => [row.reference, row.id]));
  for (const [index, order] of org.orders.entries()) {
    if (!order.lines?.length) continue;
    const orderId = orderIdByRef.get(index + 1);
    if (!orderId) continue;
    const subject = { context, subjectType: "ORDER" as const, subjectId: orderId };
    for (const part of await listSubjectAssignments(subject)) {
      const name = responsibilityName.get(part.responsibilityId ?? "");
      if (name) failures.push(...partFailures({ org, order, part, names, responsibility: name }));
    }
  }
  return failures;
}
