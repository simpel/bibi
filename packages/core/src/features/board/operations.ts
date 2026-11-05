import { defineOperation } from "../../operations/define-operation";
import { archiveBoardHandler, reorderBoardsHandler } from "./order-handlers";
import { getBoardHandler, listBoardsHandler } from "./read-handlers";
import {
  BoardCreateInputSchema,
  BoardIdInputSchema,
  BoardListInputSchema,
  BoardListOutputSchema,
  BoardReorderInputSchema,
  BoardSchema,
  BoardUpdateInputSchema,
} from "./schema";
import { createBoardHandler, updateBoardHandler } from "./write-handlers";

export const listBoards = defineOperation({
  name: "board.list",
  kind: "query",
  description:
    "List the organization's boards (saved views of orders, ADR 0067) in order; the first is the " +
    "default. Each board has its filter (order type, assignee) and its phases (columns) left to " +
    "right, each with the order status ids it shows. A status in no phase is not on that board.",
  input: BoardListInputSchema,
  output: BoardListOutputSchema,
  permission: "board:read",
  handler: listBoardsHandler,
});

export const getBoard = defineOperation({
  name: "board.get",
  kind: "query",
  description: "Get one board by id, with its filter and its phases and their order status ids.",
  input: BoardIdInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: getBoardHandler,
});

export const createBoard = defineOperation({
  name: "board.create",
  kind: "command",
  description:
    "Create a board: a saved view of orders with an optional filter (order type, main " +
    "assignee). It is placed last and starts with one phase (column) per active order status, " +
    "open statuses first; group them with boardPhase.create, boardPhase.moveStatus and " +
    "boardPhase.archive.",
  input: BoardCreateInputSchema,
  output: BoardSchema,
  permission: "board:write",
  handler: createBoardHandler,
});

export const updateBoard = defineOperation({
  name: "board.update",
  kind: "command",
  description:
    "Rename a board or change its filter (entityTypeId, assigneeId; null clears a filter). " +
    "Its phases are unchanged.",
  input: BoardUpdateInputSchema,
  output: BoardSchema,
  permission: "board:write",
  handler: updateBoardHandler,
});

export const reorderBoards = defineOperation({
  name: "board.reorder",
  kind: "command",
  description:
    "Set the order of the boards: pass every active board id once, in the new order. The first " +
    "board is the default one.",
  input: BoardReorderInputSchema,
  output: BoardListOutputSchema,
  permission: "board:write",
  handler: reorderBoardsHandler,
});

export const archiveBoard = defineOperation({
  name: "board.archive",
  kind: "command",
  description:
    "Archive a board and its phases (boards are never deleted). Orders and statuses are " +
    "unchanged: a board is only a view. The organization's last board cannot be archived (CONFLICT).",
  input: BoardIdInputSchema,
  output: BoardSchema,
  permission: "board:delete",
  handler: archiveBoardHandler,
});

/** Every board operation (ADR 0067); handlers live in the sibling files. */
export const boardOperations = [
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  reorderBoards,
  archiveBoard,
];
