import {
  activatePipelineSetup,
  type PipelineActivateOutput,
  type PipelineCellDraft,
  PipelineCellDraftSchema,
  type PipelinePhaseDraft,
  PipelinePhaseDraftSchema,
  type PipelinePreview,
  type PipelinePreviewLine,
  PipelinePreviewLineSchema,
  type PipelinePreviewStep,
  PipelinePreviewStepSchema,
  type PipelineProblem,
  PipelineProblemSchema,
  type PipelineSetupDraft,
  type PipelineStateDraft,
  PipelineStateDraftSchema,
  type PipelineTypeDraft,
  PipelineTypeDraftSchema,
  presetDraftPipelineSetup,
  previewPipelineSetup,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { ItemStateRef } from "../item-state/graphql";
import { PhaseGridRef } from "../phase-grid/graphql";
import { TicketPhaseRef } from "../ticket-phase/graphql";

const ProblemRef = objectFromSchema<PipelineProblem>({
  name: "PipelineProblem",
  schema: PipelineProblemSchema,
  description: "A configuration problem of a pipeline setup; errors block activation.",
});

const LineRef = objectFromSchema<PipelinePreviewLine>({
  name: "PipelinePreviewLine",
  schema: PipelinePreviewLineSchema,
  description: "One line of the simulated ticket in one phase: its state and hold.",
});

const StepRef = objectFromSchema<PipelinePreviewStep>({
  name: "PipelinePreviewStep",
  schema: PipelinePreviewStepSchema,
  omit: ["lines"],
  description: "The simulated ticket after entering one phase.",
});
builder.objectFields(StepRef, (t) => ({
  lines: t.field({ type: [LineRef], resolve: (step) => step.lines }),
}));

const PreviewRef = builder.objectRef<PipelinePreview>("PipelinePreview");
PreviewRef.implement({
  description: "The guided pipeline setup's preview (ADR 0044); nothing is saved.",
  fields: (t) => ({
    ready: t.boolean({
      description: "No problem is an error: the setup can be activated.",
      resolve: (preview) => preview.ready,
    }),
    problems: t.field({ type: [ProblemRef], resolve: (preview) => preview.problems }),
    steps: t.field({ type: [StepRef], resolve: (preview) => preview.steps }),
  }),
});

const ActivateRef = builder.objectRef<PipelineActivateOutput>("PipelineActivation");
ActivateRef.implement({
  description: "The pipeline as activated: phases, the set-up types' states and the grid.",
  fields: (t) => ({
    phases: t.field({ type: [TicketPhaseRef], resolve: (result) => result.phases as never }),
    states: t.field({ type: [ItemStateRef], resolve: (result) => result.states as never }),
    grid: t.field({ type: PhaseGridRef, resolve: (result) => result.grid }),
  }),
});

fieldFromOperation({
  operation: previewPipelineSetup,
  type: PreviewRef,
  name: "pipelineSetupPreview",
});
mutationFromOperation({ operation: activatePipelineSetup, type: ActivateRef });

const StateDraftRef = objectFromSchema<PipelineStateDraft>({
  name: "PipelineStateDraft",
  schema: PipelineStateDraftSchema,
  description: "One state of an item type in a pipeline setup draft.",
});

const TypeDraftRef = objectFromSchema<PipelineTypeDraft>({
  name: "PipelineTypeDraft",
  schema: PipelineTypeDraftSchema,
  omit: ["states"],
  description: "One item type in a pipeline setup draft: existing (entityTypeId) or new.",
});
builder.objectFields(TypeDraftRef, (t) => ({
  states: t.field({ type: [StateDraftRef], resolve: (type) => type.states }),
}));

const PhaseDraftRef = objectFromSchema<PipelinePhaseDraft>({
  name: "PipelinePhaseDraft",
  schema: PipelinePhaseDraftSchema,
  description: "One ticket phase in a pipeline setup draft.",
});

const CellDraftRef = objectFromSchema<PipelineCellDraft>({
  name: "PipelineCellDraft",
  schema: PipelineCellDraftSchema,
  description: "One grid cell in a pipeline setup draft, by name.",
});

const DraftRef = builder.objectRef<PipelineSetupDraft>("PipelineSetupDraft");
DraftRef.implement({
  description: "A whole pipeline setup draft (ADR 0045); nothing is saved.",
  fields: (t) => ({
    itemTypes: t.field({ type: [TypeDraftRef], resolve: (draft) => draft.itemTypes }),
    phases: t.field({ type: [PhaseDraftRef], resolve: (draft) => draft.phases }),
    cells: t.field({ type: [CellDraftRef], resolve: (draft) => draft.cells }),
  }),
});

fieldFromOperation({
  operation: presetDraftPipelineSetup,
  type: DraftRef,
  name: "pipelineSetupPresetDraft",
});
