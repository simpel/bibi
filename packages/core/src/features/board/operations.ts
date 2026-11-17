import { defineOperation } from "../../operations/define-operation";
import { archiveBoardHandler, shareBoardHandler } from "./order-handlers";
import { getBoardHandler, listBoardsHandler } from "./read-handlers";
import {
  BoardCreateInputSchema,
  BoardIdInputSchema,
  BoardListInputSchema,
  BoardListOutputSchema,
  BoardSchema,
  BoardShareInputSchema,
  BoardUpdateInputSchema,
} from "./schema";
import { createBoardHandler, updateBoardHandler } from "./write-handlers";

/**
 * Pipeline views (ADR 0067, 0111). Every member sees boards (`board:read`) and makes their own
 * views, so the commands run on `board:read` and the handler checks the view: who sees it, the
 * default view (`board:write`) and the owner (`board:delete` for anyone else's).
 */
export const listBoards = defineOperation({
  name: "board.list",
  kind: "query",
  description:
    "List the pipeline views (boards, ADR 0067, 0111) the caller sees: the default view first, " +
    "then by name. The caller sees the default view, views shared with the organization, their " +
    "own and those shared with them. Each has its filter (order type, assignee), its sharing and " +
    "its phases (columns) left to right, each with the order status ids it shows.",
  input: BoardListInputSchema,
  output: BoardListOutputSchema,
  permission: "board:read",
  handler: listBoardsHandler,
});

export const getBoard = defineOperation({
  name: "board.get",
  kind: "query",
  description:
    "Get one pipeline view by id, with its filter, sharing and phases and their order status " +
    "ids. A view the caller does not see is NOT_FOUND.",
  input: BoardIdInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: getBoardHandler,
});

export const createBoard = defineOperation({
  name: "board.create",
  kind: "command",
  description:
    "Create a pipeline view owned by the caller, private until shared (board.share), with an " +
    "optional filter (order type, main assignee). It starts with one phase (column) per active " +
    "order status, open statuses first; group them with boardPhase.create, boardPhase.moveStatus " +
    "and boardPhase.archive. The name is unique among the caller's views.",
  input: BoardCreateInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: createBoardHandler,
});

export const updateBoard = defineOperation({
  name: "board.update",
  kind: "command",
  description:
    "Rename a pipeline view or change its filter (entityTypeId, assigneeId; null clears a " +
    "filter). Everyone who sees a view may; the default view needs board:write. Its phases are " +
    "unchanged.",
  input: BoardUpdateInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: updateBoardHandler,
});

export const shareBoard = defineOperation({
  name: "board.share",
  kind: "command",
  description:
    "Set who a pipeline view is shared with: the whole organization (`organization`) and/or " +
    "specific members (`userIds`, replacing the list). Only the view's owner or a holder of " +
    "board:delete may. The default view is always shared with everyone (CONFLICT).",
  input: BoardShareInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: shareBoardHandler,
});

export const archiveBoard = defineOperation({
  name: "board.archive",
  kind: "command",
  description:
    "Archive a pipeline view and its phases (views are never deleted). Only its owner or a " +
    "holder of board:delete may. Orders and statuses are unchanged: a view is only a view. The " +
    "default view cannot be archived (CONFLICT).",
  input: BoardIdInputSchema,
  output: BoardSchema,
  permission: "board:read",
  handler: archiveBoardHandler,
});

/** Every board operation (ADR 0067, 0111); handlers live in the sibling files. */
export const boardOperations = [
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  shareBoard,
  archiveBoard,
];
