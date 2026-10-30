import {
  type PipelineBoard,
  type PipelineCard,
  PipelineCardSchema,
  type PipelineColumn,
  PipelineColumnSchema,
  type PipelineStatus,
  PipelineStatusSchema,
  pipelineBoard,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const PipelineStatusRef = objectFromSchema<PipelineStatus>({
  name: "PipelineStatus",
  schema: PipelineStatusSchema,
  description: "A ticket status shown in a pipeline column: one drop zone of the column.",
});
const PipelineColumnRef = objectFromSchema<PipelineColumn>({
  name: "PipelineColumn",
  schema: PipelineColumnSchema,
  omit: ["statuses"],
  description: "A column of the pipeline board: one phase of the board, with its statuses.",
});
const PipelineCardRef = objectFromSchema<PipelineCard>({
  name: "PipelineCard",
  schema: PipelineCardSchema,
  description: "A ticket on the pipeline board, with the column (phase) and status it sits in.",
});

builder.objectField(PipelineColumnRef, "statuses", (t) =>
  t.field({
    type: [PipelineStatusRef],
    description: "The ticket statuses in this column, in status order.",
    resolve: (column) => column.statuses,
  }),
);

const PipelineBoardRef = builder.objectRef<PipelineBoard>("PipelineBoard").implement({
  description: "The pipeline board: columns left to right and one card per ticket.",
  fields: (t) => ({
    boardId: t.string({ nullable: true, resolve: (board) => board.boardId }),
    boardName: t.string({ nullable: true, resolve: (board) => board.boardName }),
    columns: t.field({ type: [PipelineColumnRef], resolve: (board) => board.columns }),
    cards: t.field({ type: [PipelineCardRef], resolve: (board) => board.cards }),
    unmappedCount: t.int({
      description: "Matching tickets whose status is in no phase of this board, so not shown",
      resolve: (board) => board.unmappedCount,
    }),
  }),
});

fieldFromOperation({ operation: pipelineBoard, type: PipelineBoardRef, name: "pipelineBoard" });
