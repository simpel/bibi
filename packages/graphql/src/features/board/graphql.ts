import {
  archiveBoard,
  archiveBoardPhase,
  type BoardDto,
  type BoardPhaseDto,
  BoardPhaseSchema,
  BoardSchema,
  createBoard,
  createBoardPhase,
  getBoard,
  listBoards,
  moveBoardPhaseStatus,
  reorderBoardPhases,
  shareBoard,
  updateBoard,
  updateBoardPhase,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const BoardPhaseRef = objectFromSchema<BoardPhaseDto>({
  name: "BoardPhase",
  schema: BoardPhaseSchema,
  omit: ["organizationId"],
  description:
    "Board phase – a column of a board with a name, a color and the order statuses it shows " +
    "(`statusIds`, in status order). Reordering phases and moving a status return the Board; " +
    "see the board mutations.",
});

mutationFromOperation({ operation: createBoardPhase, type: BoardPhaseRef });
mutationFromOperation({ operation: updateBoardPhase, type: BoardPhaseRef });
mutationFromOperation({ operation: archiveBoardPhase, type: BoardPhaseRef });

export const BoardRef = objectFromSchema<BoardDto>({
  name: "Board",
  schema: BoardSchema,
  omit: ["organizationId", "phases"],
  description:
    "Board – a pipeline view of orders: a name, an optional type and assignee filter, who it " +
    "is shared with and its phases (columns). Listed default view first, then by name.",
});
const BoardPageRef = pageType({ name: "BoardPage", item: BoardRef });

builder.objectField(BoardRef, "phases", (t) =>
  t.field({
    type: [BoardPhaseRef],
    description: "Active phases of the board, left to right, each with its statuses.",
    resolve: (board) => board.phases,
  }),
);

fieldFromOperation({ operation: listBoards, type: BoardPageRef, name: "boards" });
fieldFromOperation({ operation: getBoard, type: BoardRef, name: "board" });
mutationFromOperation({ operation: createBoard, type: BoardRef });
mutationFromOperation({ operation: updateBoard, type: BoardRef });
mutationFromOperation({ operation: archiveBoard, type: BoardRef });
mutationFromOperation({ operation: shareBoard, type: BoardRef });
mutationFromOperation({ operation: reorderBoardPhases, type: BoardRef });
mutationFromOperation({ operation: moveBoardPhaseStatus, type: BoardRef });
