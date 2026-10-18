import {
  type PipelineBoard,
  type PipelineCard,
  PipelineCardSchema,
  type PipelineColumn,
  PipelineColumnSchema,
  pipelineBoard,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const PipelineColumnRef = objectFromSchema<PipelineColumn>({
  name: "PipelineColumn",
  schema: PipelineColumnSchema,
  description:
    "A lane of the pipeline board: an inquiry stage or one of the organization's booking statuses.",
});
const PipelineCardRef = objectFromSchema<PipelineCard>({
  name: "PipelineCard",
  schema: PipelineCardSchema,
  description: "An inquiry or booking on the pipeline board, with the lane it sits in.",
});

const PipelineBoardRef = builder.objectRef<PipelineBoard>("PipelineBoard").implement({
  description: "The pipeline board: lanes left to right and one card per inquiry or booking.",
  fields: (t) => ({
    columns: t.field({ type: [PipelineColumnRef], resolve: (board) => board.columns }),
    cards: t.field({ type: [PipelineCardRef], resolve: (board) => board.cards }),
  }),
});

fieldFromOperation({ operation: pipelineBoard, type: PipelineBoardRef, name: "pipelineBoard" });
