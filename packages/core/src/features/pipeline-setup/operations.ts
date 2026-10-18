import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { activatePipeline } from "./activate";
import { previewPipeline } from "./preview";
import { resolveBookable } from "./resolve-types";
import {
  PipelineActivateOutputSchema,
  PipelinePreviewSchema,
  PipelineSetupDraftSchema,
} from "./schema";

export const previewPipelineSetup = defineOperation({
  name: "pipelineSetup.preview",
  kind: "query",
  description:
    "Preview a whole pipeline setup without saving anything (ADR 0044): item types with their " +
    "states, phases in order and grid cells, all by name. Returns the configuration problems " +
    "(errors block activation, warnings do not) and a simulated ticket with one line per item " +
    "type stepped through every open phase and into each terminal phase, with each line's " +
    "state and hold. Use it to propose a full setup from a description of the organization.",
  input: PipelineSetupDraftSchema,
  output: PipelinePreviewSchema,
  permission: "phaseGrid:read",
  entityType: "pipelineSetup",
  handler: async ({ input, context }) => {
    const bookable = await resolveBookable({ context, draft: input });
    if (!bookable.ok) return bookable;
    return ok({ value: previewPipeline({ draft: input, bookable: bookable.value }) });
  },
});

export const activatePipelineSetup = defineOperation({
  name: "pipelineSetup.activate",
  kind: "command",
  description:
    "Save a pipeline setup (the same draft as pipelineSetup.preview, which must have no " +
    "errors) as one audited batch through the normal operations: new item types are created, " +
    "states and phases are created or updated by name, the item types' other states and the " +
    "other phases are archived (their lines and tickets move to the initial state and the entry " +
    "phase), and the order, default transitions and grid cells are set. All or nothing. Needs " +
    "configuration, itemState, ticketPhase and phaseGrid admin.",
  input: PipelineSetupDraftSchema,
  output: PipelineActivateOutputSchema,
  permission: "phaseGrid:admin",
  entityType: "pipelineSetup",
  handler: ({ input, context }) => activatePipeline({ context, draft: input }),
});

/** The guided pipeline setup (ADR 0044). */
export const pipelineSetupOperations = [previewPipelineSetup, activatePipelineSetup];
