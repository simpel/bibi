import { archiveOrderStatus, previewArchiveOrderStatus } from "./archive-operations";
import { importOrderStatusTemplate } from "./import-template-operation";
import {
  reorderOrderStatuses,
  setOrderStatusGates,
  setOrderStatusTransitions,
} from "./order-operations";
import { getOrderStatus, listOrderStatuses } from "./read-operations";
import { createOrderStatus, updateOrderStatus } from "./write-operations";

/** Every order status operation (ADR 0043); implementations live in the sibling files. */
export const orderStatusOperations = [
  listOrderStatuses,
  getOrderStatus,
  createOrderStatus,
  updateOrderStatus,
  archiveOrderStatus,
  previewArchiveOrderStatus,
  reorderOrderStatuses,
  setOrderStatusTransitions,
  setOrderStatusGates,
  importOrderStatusTemplate,
];
