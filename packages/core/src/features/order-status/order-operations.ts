import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadAllOrderStatuses, loadOrderStatus } from "./load-order-status";
import {
  OrderStatusSetGatesInputSchema,
  OrderStatusSetTransitionsInputSchema,
} from "./move-schema";
import { replaceGates } from "./replace-gates";
import { replaceTransitions } from "./replace-transitions";
import {
  OrderStatusListOutputSchema,
  OrderStatusReorderInputSchema,
  OrderStatusSchema,
} from "./schema";

const reorderProblem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "ids", message }] });

export const reorderOrderStatuses = defineOperation({
  name: "orderStatus.reorder",
  kind: "command",
  description:
    "Set the order of the order statuses (the board's columns, left to right): pass every " +
    "active status id once, in the new order.",
  input: OrderStatusReorderInputSchema,
  output: OrderStatusListOutputSchema,
  permission: "pipeline:write",
  // Each moved status is audited as a orderStatus change.
  entityType: "orderStatus",
  handler: async ({ input: { ids }, context }) => {
    const current = await loadAllOrderStatuses({ context });
    const known = new Set(current.map((orderStatus) => orderStatus.id));
    const complete = ids.length === current.length && new Set(ids).size === ids.length;
    if (!complete || ids.some((id) => !known.has(id))) {
      return reorderProblem({ message: "List every active order status exactly once" });
    }
    for (const [position, id] of ids.entries()) {
      const before = current.find((orderStatus) => orderStatus.id === id);
      if (!before || before.position === position) continue;
      await context.db.orderStatus.update({ where: { id }, data: { position } });
      context.recordChange({ entityId: id, before, after: { ...before, position } });
    }
    return ok({ value: { items: await loadAllOrderStatuses({ context }), nextCursor: null } });
  },
});

const problem = ({ message, path = "toStatusIds" }: { message: string; path?: string }) =>
  invalid({ message, issues: [{ path, message }] });

export const setOrderStatusTransitions = defineOperation({
  name: "orderStatus.setTransitions",
  kind: "command",
  description:
    "Set where an order may move from one status (ADR 0076). `allowedNext` ANY lets it move to " +
    "any status (the default); ONLY_THESE restricts it to `toStatusIds` (an empty list makes the " +
    "status a dead end). A closing status is always a dead end (ADR 0043). Gates on the moves " +
    "are set with orderStatus.setGates.",
  input: OrderStatusSetTransitionsInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, allowedNext, toStatusIds }, context }) => {
    const before = await loadOrderStatus({ context, id });
    if (!before) return notFound({ entity: "Order status" });
    const targets = allowedNext === "ANY" ? null : [...new Set(toStatusIds)];
    if (before.closes && targets !== null && targets.length > 0) {
      return problem({ message: "A closing status has no moves out" });
    }
    if (targets?.includes(id)) return problem({ message: "A status cannot move to itself" });
    const found = await context.db.orderStatus.count({ where: { id: { in: targets ?? [] } } });
    if (found !== (targets?.length ?? 0)) {
      return problem({ message: "Unknown or archived target status" });
    }
    await replaceTransitions({ context, before, targets: before.closes ? null : targets });
    const after = await loadOrderStatus({ context, id });
    if (!after) return notFound({ entity: "Order status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const setOrderStatusGates = defineOperation({
  name: "orderStatus.setGates",
  kind: "command",
  description:
    "Replace the gates on moves into one status (ADR 0076). Each entry names a source status or " +
    "null for any status, and its gates (REASON needs a reason, ASSIGNEE the main assignee, " +
    "ACCEPTED_QUOTE an accepted quote). A move passes only if every gate from any status and " +
    "from its own source passes. Pass the full set.",
  input: OrderStatusSetGatesInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, gates }, context }) => {
    const before = await loadOrderStatus({ context, id });
    if (!before) return notFound({ entity: "Order status" });
    const sources = [...new Set(gates.flatMap(({ fromStatusId }) => fromStatusId ?? []))];
    if (sources.includes(id)) {
      return problem({ message: "A status cannot gate a move from itself", path: "gates" });
    }
    const found = await context.db.orderStatus.count({ where: { id: { in: sources } } });
    if (found !== sources.length) {
      return problem({ message: "Unknown or archived source status", path: "gates" });
    }
    await replaceGates({ context, toStatusId: id, gates });
    const after = await loadOrderStatus({ context, id });
    if (!after) return notFound({ entity: "Order status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
