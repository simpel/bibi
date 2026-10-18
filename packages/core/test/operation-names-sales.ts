/**
 * Sales pipeline operations (ADR 0022, 0044): line states and quotes, kept apart so `operation-names.ts`
 * stays within the size limit.
 */
export const SALES_NAMES = [
  "itemState.archive",
  "itemState.create",
  "itemState.get",
  "itemState.list",
  "itemState.reorder",
  "itemState.setTransitions",
  "itemState.update",
  "line.changeState",
  "line.followPhase",
  "phaseGrid.get",
  "phaseGrid.setCell",
  "phaseGrid.importTemplate",
  "quote.create",
  "quote.decline",
  "quote.expire",
  "quote.get",
  "quote.list",
  "quote.revise",
  "quote.send",
  "quote.update",
  "ticket.expireHolds",
];
