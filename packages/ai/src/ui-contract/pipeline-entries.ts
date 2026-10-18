import { PipelineBoardSchema, PipelineCardSchema } from "@okazi/core/schemas";
import { z } from "zod";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** JSON form of the pipeline board as tool results carry it (dates = ISO strings). */
export const PipelineBoardWireSchema = PipelineBoardSchema.extend({
  cards: z.array(
    PipelineCardSchema.extend({
      startsAt: z.string().nullable(),
      endsAt: z.string().nullable(),
      phaseChangedAt: z.string(),
    }),
  ),
});

export type PipelineBoardWire = z.infer<typeof PipelineBoardWireSchema>;

const pipelineBoard = uiEntry({
  component: "pipeline-board",
  schema: PipelineBoardWireSchema,
  toProps: ({ value }) => ({ board: value }),
});

/** Tool → component for the ticket pipeline (ADR 0041, 0043). */
export const PIPELINE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  pipeline_board: pipelineBoard,
};
