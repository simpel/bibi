import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { activatePipeline } from "./activate";
import { presetDraft } from "./preset-draft";
import { PipelinePresetDraftInputSchema } from "./preset-schema";
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
    "states, statuses in order and grid cells, all by name. Returns the configuration problems " +
    "(errors block activation, warnings do not) and a simulated ticket with one line per item " +
    "type stepped through every open status and into each closing status, with each line's " +
    "state and hold. Use it to propose a full setup from a description of the organization.",
  input: PipelineSetupDraftSchema,
  output: PipelinePreviewSchema,
  permission: "pipeline:read",
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
    "states and statuses are created or updated by name, the item types' other states and the " +
    "other statuses are archived (their lines and tickets move to the initial state and the entry " +
    "status), and the order, default transitions and grid cells are set. All or nothing. Needs " +
    "configuration, itemState, ticketStatus and statusGrid admin.",
  input: PipelineSetupDraftSchema,
  output: PipelineActivateOutputSchema,
  permission: "pipeline:write",
  entityType: "pipelineSetup",
  handler: ({ input, context }) => activatePipeline({ context, draft: input }),
});

export const presetDraftPipelineSetup = defineOperation({
  name: "pipelineSetup.presetDraft",
  kind: "query",
  description:
    "A whole pipeline setup draft from a setup preset (ADR 0045), saving nothing: the " +
    "organization's own item types are kept, the preset adds the ones it is missing, and states, " +
    "statuses and the grid come from the templates. Adjust its item types and statuses by name, then " +
    "check it with pipelineSetup.preview. Use it for an organization's first setup.",
  input: PipelinePresetDraftInputSchema,
  output: PipelineSetupDraftSchema,
  permission: "pipeline:read",
  entityType: "pipelineSetup",
  handler: ({ input, context }) => presetDraft({ context, input }),
});

/** The guided pipeline setup (ADR 0044) and its presets (ADR 0045). */
export const pipelineSetupOperations = [
  previewPipelineSetup,
  activatePipelineSetup,
  presetDraftPipelineSetup,
];
