import { defineOperation } from "../../operations/define-operation";
import { boardOperations } from "../board/operations";
import {
  moveBoardPhaseStatusHandler,
  reorderBoardPhasesHandler,
} from "../board/phase-order-handlers";
import {
  archiveBoardPhaseHandler,
  createBoardPhaseHandler,
  updateBoardPhaseHandler,
} from "../board/phase-write-handlers";
import {
  BoardPhaseCreateInputSchema,
  BoardPhaseIdInputSchema,
  BoardPhaseMoveStatusInputSchema,
  BoardPhaseReorderInputSchema,
  BoardPhaseSchema,
  BoardPhaseUpdateInputSchema,
  BoardSchema,
} from "../board/schema";
import { dashboardOperations, dashboardSummary } from "../dashboard/operations";
import { pipelineBoardHandler } from "./board-view";
import { PipelineBoardInputSchema, PipelineBoardSchema } from "./schema";

export const pipelineBoard = defineOperation({
  name: "pipeline.board",
  kind: "query",
  description:
    "A board of orders (ADR 0041, 0067): `boardId` picks the board (board.list), default the " +
    "first. One column per phase of the board, each listing its order statuses (one drop zone " +
    "each), and one card per order in the phase of its status; orders whose status is on no " +
    "phase are only counted (`unmappedCount`). The board's filter applies; `assigneeId` and " +
    "`entityTypeId` replace it. Orders in closing statuses appear only for " +
    "`closedWithinDays` days. A card names its customer by id only (customer.get or " +
    "customer.list resolve it); its held and booked line counts are null without program:read.",
  input: PipelineBoardInputSchema,
  output: PipelineBoardSchema,
  permission: "order:read",
  // The cards are orders; a card's customer is only its id (ADR 0050, feature scope).
  entityType: "order",
  handler: pipelineBoardHandler,
});

export const createBoardPhase = defineOperation({
  name: "boardPhase.create",
  kind: "command",
  description:
    "Add a phase (column) to a board: a name, an optional `position` (index, " +
    "default last) and the order statuses it shows (`statusIds`). A status is in one phase per " +
    "board, so each listed status leaves its current phase on this board. Orders are unchanged.",
  input: BoardPhaseCreateInputSchema,
  output: BoardPhaseSchema,
  permission: "board:write",
  handler: createBoardPhaseHandler,
});

export const updateBoardPhase = defineOperation({
  name: "boardPhase.update",
  kind: "command",
  description: "Rename a board phase (column). Its statuses and orders are unchanged.",
  input: BoardPhaseUpdateInputSchema,
  output: BoardPhaseSchema,
  permission: "board:write",
  handler: updateBoardPhaseHandler,
});

export const archiveBoardPhase = defineOperation({
  name: "boardPhase.archive",
  kind: "command",
  description:
    "Remove a phase (column) from its board. Its statuses leave the board (move them first with " +
    "boardPhase.moveStatus to keep them on it); orders and statuses are unchanged.",
  input: BoardPhaseIdInputSchema,
  output: BoardPhaseSchema,
  permission: "board:delete",
  handler: archiveBoardPhaseHandler,
});

export const reorderBoardPhases = defineOperation({
  name: "boardPhase.reorder",
  kind: "command",
  description:
    "Set the order of a board's phases (columns, left to right): pass every active phase id of " +
    "the board once, in the new order. Returns the board.",
  input: BoardPhaseReorderInputSchema,
  output: BoardSchema,
  permission: "board:write",
  // Audited on the board whose column order changes.
  entityType: "board",
  handler: reorderBoardPhasesHandler,
});

export const moveBoardPhaseStatus = defineOperation({
  name: "boardPhase.moveStatus",
  kind: "command",
  description:
    "Show an order status in another phase (column) of a board, or take it off the board with " +
    "`phaseId: null`. A status is in one phase per board. Orders keep their status; only where " +
    "the board shows them changes. Returns the board.",
  input: BoardPhaseMoveStatusInputSchema,
  output: BoardSchema,
  permission: "board:write",
  // Audited on the board whose layout changes.
  entityType: "board",
  handler: moveBoardPhaseStatusHandler,
});

/** The board view, board phases and boards (ADR 0067); handlers live in sibling files. */
export const pipelineOperations = [
  pipelineBoard,
  createBoardPhase,
  updateBoardPhase,
  archiveBoardPhase,
  reorderBoardPhases,
  moveBoardPhaseStatus,
  ...boardOperations,
];

// The dashboard view reaches the package index through here (its size limit).
export { dashboardOperations, dashboardSummary };
