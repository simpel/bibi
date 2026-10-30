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
  reorderBoards,
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
    "Board phase – a column of a board with a name, a color and the ticket statuses it shows " +
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
    "Board – a saved view of tickets: a name, an optional type and assignee filter and its " +
    "phases (columns). The first board is the default.",
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
mutationFromOperation({ operation: reorderBoards, type: BoardPageRef });
mutationFromOperation({ operation: reorderBoardPhases, type: BoardRef });
mutationFromOperation({ operation: moveBoardPhaseStatus, type: BoardRef });
