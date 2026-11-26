import { listOrders, type TaskDto } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

export type LoadLinkableOrdersInput = { task: Pick<TaskDto, "customerId"> };

/**
 * The customer's active orders a task may be added to or moved to. Started by the page and
 * unwrapped by the Add to order dialog, so it never delays the first paint (ADR 0097).
 */
export async function loadLinkableOrders({
  task,
}: LoadLinkableOrdersInput): Promise<readonly NamedOption[]> {
  const abilities = await getCallerAbilities();
  if (!task.customerId || !can({ abilities, permission: "order:read" })) return [];
  const result = await runOperation({
    operation: listOrders,
    input: { customerId: task.customerId, limit: 50 },
  });
  if (!result.ok) return [];
  return result.value.items.map((order) => ({
    id: order.id,
    name: `#${order.reference} ${order.title ?? ""}`.trim(),
  }));
}
