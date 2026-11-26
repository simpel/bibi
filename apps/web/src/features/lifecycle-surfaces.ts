import type { WebSurface } from "./web-surfaces";

/**
 * Restore and delete of an archived record are on the Archive page, Administration, Archive
 * (ADR 0118, spec: danger-area); an order is archived on its own page.
 */
export const LIFECYCLE_SURFACES: readonly WebSurface[] = [
  { operation: "order.archive", route: "/orders/[id]" },
  { operation: "archive.list", route: "/admin/archive" },
  { operation: "itemTypeGroup.restore", route: "/admin/archive" },
  { operation: "itemTypeGroup.delete", route: "/admin/archive" },
  { operation: "task.restore", route: "/admin/archive" },
  { operation: "task.delete", route: "/admin/archive" },
  { operation: "customer.restore", route: "/admin/archive" },
  { operation: "customer.delete", route: "/admin/archive" },
  { operation: "item.restore", route: "/admin/archive" },
  { operation: "item.delete", route: "/admin/archive" },
  { operation: "venue.restore", route: "/admin/archive" },
  { operation: "venue.delete", route: "/admin/archive" },
  { operation: "orderTemplate.restore", route: "/admin/archive" },
  { operation: "orderTemplate.delete", route: "/admin/archive" },
  { operation: "priceList.restore", route: "/admin/archive" },
  { operation: "priceList.delete", route: "/admin/archive" },
  { operation: "entityType.restore", route: "/admin/archive" },
  { operation: "entityType.delete", route: "/admin/archive" },
  { operation: "vocabulary.restore", route: "/admin/archive" },
  { operation: "vocabulary.delete", route: "/admin/archive" },
  { operation: "responsibility.restore", route: "/admin/archive" },
  { operation: "responsibility.delete", route: "/admin/archive" },
  { operation: "runSheetDefinition.restore", route: "/admin/archive" },
  { operation: "runSheetDefinition.delete", route: "/admin/archive" },
  { operation: "skill.restore", route: "/admin/archive" },
  { operation: "skill.delete", route: "/admin/archive" },
  { operation: "orderStatus.restore", route: "/admin/archive" },
  { operation: "orderStatus.delete", route: "/admin/archive" },
  { operation: "order.restore", route: "/admin/archive" },
  { operation: "order.delete", route: "/admin/archive" },
];
