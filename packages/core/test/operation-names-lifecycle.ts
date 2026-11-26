/** Restore and delete of every record with its own page, plus `order.archive` and the Archive page (ADR 0118). */
export const LIFECYCLE_NAMES = [
  ...[
    "customer",
    "entityType",
    "item",
    "itemTypeGroup",
    "order",
    "orderStatus",
    "orderTemplate",
    "priceList",
    "responsibility",
    "runSheetDefinition",
    "skill",
    "task",
    "venue",
    "vocabulary",
  ].flatMap((entity) => [`${entity}.restore`, `${entity}.delete`]),
  "order.archive",
  "archive.list",
];
