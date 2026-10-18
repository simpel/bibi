import type { ResponsibilityCreateInput } from "@okazi/core";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { WizardStepDef } from "@/components/wizard/step-wizard";
import { ResponsibilityAssigneeField, ResponsibilityIdsField } from "./responsibility-form-fields";
import type { ResponsibilityFormValues } from "./responsibility-form-schema";
import type { ResponsibilityOptions } from "./responsibility-options";

type Form = UseFormReturn<ResponsibilityFormValues, unknown, ResponsibilityCreateInput>;
type Text = { id: string; label: string; description: string };

export type ResponsibilityStepsInput = {
  form: Form;
  options: ResponsibilityOptions;
  nameLabel: string;
  text: (input: { id: string }) => Text;
};

/** The responsibility wizard's steps: name and covered types, then who it goes to. */
export function responsibilitySteps({ form, options, nameLabel, text }: ResponsibilityStepsInput) {
  const steps: WizardStepDef<ResponsibilityFormValues>[] = [
    {
      ...text({ id: "scope" }),
      fields: ["name", "entityTypeIds"],
      content: (
        <>
          <TextField form={form} name="name" label={nameLabel} required />
          <ResponsibilityIdsField form={form} name="entityTypeIds" options={options.types} />
        </>
      ),
    },
    {
      ...text({ id: "people" }),
      fields: ["defaultAssigneeId", "defaultFollowerIds"],
      content: (
        <>
          <ResponsibilityAssigneeField form={form} people={options.people} />
          <ResponsibilityIdsField form={form} name="defaultFollowerIds" options={options.people} />
        </>
      ),
    },
  ];
  return steps;
}
