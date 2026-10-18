import {
  cellsFromTemplate,
  defaultStateTemplate,
  type PipelineTemplateKey,
  phasesFromTemplate,
  statesFromTemplate,
} from "@okazi/core/pipeline-setup-templates";
import { NONE } from "@/components/form/option-select-field";
import type { SetupFormValues, SetupTypeValues } from "./setup-form-schema";

/** An item type of the organization the wizard can include. */
export type SetupTypeOption = { id: string; name: string; bookable: boolean };

export type TypeFromOptionInput = { option: SetupTypeOption };

/** A wizard type for an existing item type (or a new one with `id` ""), from its template. */
export function typeFromOption({ option }: TypeFromOptionInput): SetupTypeValues {
  const stateTemplate = defaultStateTemplate({ bookable: option.bookable });
  const { states, expiryState } = statesFromTemplate({
    template: stateTemplate,
    bookable: option.bookable,
  });
  return {
    entityTypeId: option.id,
    name: option.name,
    bookable: option.bookable,
    stateTemplate,
    states,
    expiryState: expiryState ?? NONE,
  };
}

export type TemplateValuesInput = {
  template: PipelineTemplateKey;
  itemTypes: SetupTypeValues[];
};

/** Phases and grid from a template for the given types (step 3's template choice). */
export function templateValues({ template, itemTypes }: TemplateValuesInput): SetupFormValues {
  const phases = phasesFromTemplate({ template });
  return { template, itemTypes, phases, cells: cellsFromTemplate({ template, phases, itemTypes }) };
}
