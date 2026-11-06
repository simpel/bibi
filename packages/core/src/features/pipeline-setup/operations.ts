import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { regenerateRunSheets } from "../run-sheet/regenerate";
import { activatePipeline } from "./activate";
import { createExamples, examplesIndexed } from "./create-examples";
import {
  PipelineCreateExamplesInputSchema,
  PipelineCreateExamplesOutputSchema,
} from "./examples-schema";
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
    "(errors block activation, warnings do not) and a simulated order with one line per item " +
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
    "other statuses are archived (their lines and orders move to the initial state and the entry " +
    "status), and the order, default transitions and grid cells are set. All or nothing. Needs " +
    "configuration, itemState, orderStatus and statusGrid admin.",
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

export const createExamplesPipelineSetup = defineOperation({
  name: "pipelineSetup.createExamples",
  kind: "command",
  description:
    "Create example orders so a new organization's pipeline board is not empty, all or " +
    "nothing. Every text comes from the caller in the user's language. A customer, contact, " +
    "order or line type is created with the given name only when the organization has none; " +
    "otherwise its first one is used. Then the example customer with its contact person and " +
    "each order with its lines over the order's time (a day from today and local start and end " +
    "times in the organization's time zone), assigned to the caller. A line names one of the " +
    "organization's item types (entityType.list base ITEM) and an item in it, found or created " +
    "by name; a line whose item type does not exist is left out. An order with `advance` is " +
    "moved from the entry status to the first later open status that is entered by hand, " +
    "when the organization's rules allow it. Returns the customer and order ids; archive the " +
    "customer with its orders (customer.archive) to remove the examples.",
  input: PipelineCreateExamplesInputSchema,
  output: PipelineCreateExamplesOutputSchema,
  permission: "pipeline:write",
  entityType: "pipelineSetup",
  alsoIndexed: examplesIndexed,
  followUp: async ({ output, context }) => {
    for (const orderId of output.orderIds) await regenerateRunSheets({ context, orderId });
  },
  handler: ({ input, context }) => createExamples({ context, input }),
});

/** The guided pipeline setup (ADR 0044) and its presets (ADR 0045). */
export const pipelineSetupOperations = [
  previewPipelineSetup,
  activatePipelineSetup,
  presetDraftPipelineSetup,
  createExamplesPipelineSetup,
];
