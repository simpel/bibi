import type {
  PipelineTemplateKey,
  StateTemplateChoice,
} from "@okazi/core/pipeline-setup-templates";
import {
  type PipelineCellDraft,
  type PipelinePhaseDraft,
  type PipelineSetupDraft,
  PipelineSetupDraftSchema,
  type PipelineStateDraft,
} from "@okazi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

export type SetupStateValues = Required<PipelineStateDraft>;

/** One item type of the wizard; `entityTypeId` "" is a new type. */
export type SetupTypeValues = {
  entityTypeId: string;
  name: string;
  bookable: boolean;
  /** The template the states came from; "" when they are the type's own. */
  stateTemplate: StateTemplateChoice | "";
  states: SetupStateValues[];
  /** The expiry state's name, or `NONE`. */
  expiryState: string;
};

export type SetupPhaseValues = Required<PipelinePhaseDraft>;

/** The wizard's form: the draft (by name) plus the choices that only fill it. */
export type SetupFormValues = {
  /** The template the phases came from; "" when they are the organization's own. */
  template: PipelineTemplateKey | "";
  itemTypes: SetupTypeValues[];
  phases: SetupPhaseValues[];
  cells: PipelineCellDraft[];
};

export type ValidCellsInput = { values: Pick<SetupFormValues, "itemTypes" | "phases" | "cells"> };

/** The cells that still name an open phase, a type and one of its states (after renames). */
export function validCells({ values }: ValidCellsInput): PipelineCellDraft[] {
  return values.cells.filter((cell) => {
    const phase = values.phases.find((row) => row.name === cell.phase);
    const type = values.itemTypes.find((row) => row.name === cell.type);
    return phase && !phase.terminal && type?.states.some((state) => state.name === cell.state);
  });
}

/** Form values → core's draft: new types get their behaviours, only bookable types hold. */
export function setupFormToInput({ values }: { values: SetupFormValues }): PipelineSetupDraft {
  return {
    itemTypes: values.itemTypes.map((type) => ({
      ...(type.entityTypeId
        ? { entityTypeId: type.entityTypeId }
        : { behaviours: type.bookable ? (["BOOKABLE"] as const) : [] }),
      name: type.name,
      states: type.states.map((state) => ({
        ...state,
        hold: type.bookable ? state.hold : "NONE",
      })),
      expiryState: type.expiryState === NONE ? null : type.expiryState,
    })),
    phases: values.phases,
    cells: validCells({ values }),
  };
}

export const pipelineSetupFormSchema = formSchema({
  schema: PipelineSetupDraftSchema,
  toInput: setupFormToInput,
});
