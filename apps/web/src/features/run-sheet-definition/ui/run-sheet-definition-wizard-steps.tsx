import type { RunSheetDefinitionCreateInput } from "@bibi/core";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { WizardStepDef } from "@/components/wizard/step-wizard";
import {
  RunSheetContentFields,
  RunSheetResponsibilityField,
} from "./run-sheet-definition-form-fields";
import type { RunSheetDefinitionFormValues } from "./run-sheet-definition-form-schema";
import type { RunSheetOptions } from "./run-sheet-options";

type Form = UseFormReturn<RunSheetDefinitionFormValues, unknown, RunSheetDefinitionCreateInput>;
type Text = { id: string; label: string; description: string };

export type RunSheetStepsInput = {
  form: Form;
  options: RunSheetOptions;
  nameLabel: string;
  text: (input: { id: string }) => Text;
};

/** The run sheet wizard's steps: name, what it contains, then who receives it. */
export function runSheetSteps({ form, options, nameLabel, text }: RunSheetStepsInput) {
  const steps: WizardStepDef<RunSheetDefinitionFormValues>[] = [
    {
      ...text({ id: "name" }),
      fields: ["name"],
      content: <TextField form={form} name="name" label={nameLabel} required />,
    },
    {
      ...text({ id: "content" }),
      fields: ["entityTypeIds", "fieldIds", "vocabularyIds"],
      content: <RunSheetContentFields form={form} options={options} />,
    },
    {
      ...text({ id: "receiver" }),
      fields: ["responsibilityId"],
      content: (
        <RunSheetResponsibilityField form={form} responsibilities={options.responsibilities} />
      ),
    },
  ];
  return steps;
}
