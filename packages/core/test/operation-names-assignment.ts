/** Assignment operations (ADR 0034), kept apart so `operation-names.ts` stays within the size limit. */
export const ASSIGNMENT_NAMES = [
  "assignment.assign",
  "assignment.follow",
  "assignment.list",
  "assignment.listMine",
  "assignment.unfollow",
];

/** Demand and allocation operations (ADR 0059), kept apart so `operation-names.ts` fits its file. */
export const ALLOCATION_NAMES = [
  "itemDemand.archive",
  "itemDemand.create",
  "itemDemand.get",
  "itemDemand.list",
  "itemDemand.update",
  "lineAllocation.assign",
  "lineAllocation.get",
  "lineAllocation.list",
];

/** Board and board phase operations (ADR 0067), kept apart so `operation-names.ts` fits its file. */
export const BOARD_NAMES = [
  "board.archive",
  "board.create",
  "board.get",
  "board.list",
  "board.reorder",
  "board.update",
  "boardPhase.archive",
  "boardPhase.create",
  "boardPhase.moveStatus",
  "boardPhase.reorder",
  "boardPhase.update",
];
