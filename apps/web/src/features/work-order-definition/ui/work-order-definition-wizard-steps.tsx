import type { WorkOrderDefinitionCreateInput } from "@bibi/core";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { WizardStepDef } from "@/components/wizard/step-wizard";
import {
  WorkOrderContentFields,
  WorkOrderResponsibilityField,
} from "./work-order-definition-form-fields";
import type { WorkOrderDefinitionFormValues } from "./work-order-definition-form-schema";
import type { WorkOrderOptions } from "./work-order-options";

type Form = UseFormReturn<WorkOrderDefinitionFormValues, unknown, WorkOrderDefinitionCreateInput>;
type Text = { id: string; label: string; description: string };

export type WorkOrderStepsInput = {
  form: Form;
  options: WorkOrderOptions;
  nameLabel: string;
  text: (input: { id: string }) => Text;
};

/** The work order wizard's steps: name, what it contains, then who receives it. */
export function workOrderSteps({ form, options, nameLabel, text }: WorkOrderStepsInput) {
  const steps: WizardStepDef<WorkOrderDefinitionFormValues>[] = [
    {
      ...text({ id: "name" }),
      fields: ["name"],
      content: <TextField form={form} name="name" label={nameLabel} required />,
    },
    {
      ...text({ id: "content" }),
      fields: ["entityTypeIds", "fieldIds", "vocabularyIds"],
      content: <WorkOrderContentFields form={form} options={options} />,
    },
    {
      ...text({ id: "receiver" }),
      fields: ["responsibilityId"],
      content: (
        <WorkOrderResponsibilityField form={form} responsibilities={options.responsibilities} />
      ),
    },
  ];
  return steps;
}
