import {
  type OrderCue,
  OrderCueSchema,
  type PipelineBoard,
  type PipelineCard,
  PipelineCardSchema,
  type PipelineColumn,
  PipelineColumnSchema,
  type PipelineCues,
  type PipelineStatus,
  PipelineStatusSchema,
  type PipelineTaskCard,
  PipelineTaskCardSchema,
  pipelineBoard,
  pipelineCues,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const PipelineStatusRef = objectFromSchema<PipelineStatus>({
  name: "PipelineStatus",
  schema: PipelineStatusSchema,
  description: "An order status shown in a pipeline column: one drop zone of the column.",
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
  description:
    "An order on the pipeline board, with the column (phase) and status it sits in. `kind` " +
    "is always `order`; tasks are in `taskCards`.",
});
const PipelineTaskCardRef = objectFromSchema<PipelineTaskCard>({
  name: "PipelineTaskCard",
  schema: PipelineTaskCardSchema,
  description:
    "A task without an order on the pipeline board (ADR 0121), with the column (phase) and " +
    "status it sits in and the statuses `task.move` allows now.",
});

builder.objectField(PipelineColumnRef, "statuses", (t) =>
  t.field({
    type: [PipelineStatusRef],
    description: "The order statuses in this column, in status order.",
    resolve: (column) => column.statuses,
  }),
);

const PipelineBoardRef = builder.objectRef<PipelineBoard>("PipelineBoard").implement({
  description:
    "The pipeline board: columns left to right, one card per order and one per task without an order.",
  fields: (t) => ({
    boardId: t.string({ nullable: true, resolve: (board) => board.boardId }),
    boardName: t.string({ nullable: true, resolve: (board) => board.boardName }),
    columns: t.field({ type: [PipelineColumnRef], resolve: (board) => board.columns }),
    cards: t.field({ type: [PipelineCardRef], resolve: (board) => board.cards }),
    taskCards: t.field({
      type: [PipelineTaskCardRef],
      description:
        "Open tasks without an order in a status of the board, by due time (none last). Empty " +
        "without task:read or with an order type filter.",
      resolve: (board) => board.taskCards,
    }),
    unmappedCount: t.int({
      description: "Matching orders whose status is in no phase of this board, so not shown",
      resolve: (board) => board.unmappedCount,
    }),
  }),
});

fieldFromOperation({ operation: pipelineBoard, type: PipelineBoardRef, name: "pipelineBoard" });

const OrderCueRef = objectFromSchema<OrderCue>({
  name: "OrderCue",
  schema: OrderCueSchema,
  description: "An order's card cues: preliminary, only followed, and what blocks or needs fixing.",
});

const PipelineCuesRef = builder.objectRef<PipelineCues>("PipelineCues").implement({
  description: "Card cues for a set of orders, e.g. one page of the order table.",
  fields: (t) => ({
    cues: t.field({ type: [OrderCueRef], resolve: (result) => result.cues }),
  }),
});

fieldFromOperation({ operation: pipelineCues, type: PipelineCuesRef, name: "pipelineCues" });
