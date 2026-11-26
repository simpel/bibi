import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { orderStatusKind } from "./deletion-kind";
import { getOrderStatus } from "./read-operations";
import { OrderStatusIdInputSchema } from "./schema";

export const restoreOrderStatus = defineRestoreOperation({
  name: "orderStatus.restore",
  description:
    "Restore an archived status: it is active again, on no board and without a quote event, " +
    "like a new status. CONFLICT when it is not archived or an active status has its name.",
  permission: "pipeline:delete",
  kind: orderStatusKind,
  input: OrderStatusIdInputSchema,
  get: getOrderStatus,
});

export const deleteOrderStatus = defineDeleteOperation({
  name: "orderStatus.delete",
  description:
    "Delete an archived status permanently (ADR 0118), with its transitions, gates and grid " +
    "cells. An active status is CONFLICT: archive it first. CONFLICT while any order is or was " +
    "in it (archived or not) or a package starts in it.",
  permission: "pipeline:delete",
  kind: orderStatusKind,
  input: OrderStatusIdInputSchema,
});
