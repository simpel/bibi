import { allFollowUps } from "../../operations/all-follow-ups";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { notifyStatusChanged } from "../notification/follow-ups";
import { regenerateForOrder } from "../run-sheet/regenerate";
import { moveOrder } from "./move-order";
import { OrderChangeStatusInputSchema, OrderSchema } from "./schema";
import { loadOrder } from "./to-order-dto";

export const changeOrderStatus = defineOperation({
  name: "order.changeStatus",
  kind: "command",
  description:
    "Move an order to another of the organization's statuses (ADR 0043). Only moves the " +
    "organization allows (orderStatus.list transitionsTo); nothing leaves a closing status. The " +
    "transition's gates apply (orderStatus.list transitionGates): REASON needs `reason`, " +
    "ASSIGNEE a main assignee (assignment.assign), ACCEPTED_QUOTE an accepted quote; a closing " +
    "status releases every line. A refused move changes " +
    "nothing and gives CONFLICT with every blocker in `issues`.",
  input: OrderChangeStatusInputSchema,
  output: OrderSchema,
  permission: "order:write",
  followUp: allFollowUps({ steps: [regenerateForOrder, notifyStatusChanged] }),
  handler: async ({ input: { orderId, statusId, reason }, context }) => {
    const before = await loadOrder({ context, id: orderId });
    if (!before) return notFound({ entity: "Order" });
    const to = await context.db.orderStatus.findFirst({ where: { id: statusId } });
    if (!to) {
      const message = "Unknown or archived status";
      return invalid({ message, issues: [{ path: "statusId", message }] });
    }
    return moveOrder({ context, before, to, reason, trigger: "MANUAL" });
  },
});
