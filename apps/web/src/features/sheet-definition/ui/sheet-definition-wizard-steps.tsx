import type { SheetDefinitionCreateInput } from "@okazi/core";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { WizardStepDef } from "@/components/wizard/step-wizard";
import { SheetContentFields, SheetRoleField } from "./sheet-definition-form-fields";
import type { SheetDefinitionFormValues } from "./sheet-definition-form-schema";
import type { SheetOptions } from "./sheet-options";

type Form = UseFormReturn<SheetDefinitionFormValues, unknown, SheetDefinitionCreateInput>;
type Text = { id: string; label: string; description: string };

export type SheetStepsInput = {
  form: Form;
  options: SheetOptions;
  nameLabel: string;
  text: (input: { id: string }) => Text;
};

/** The sheet wizard's steps: name, what it contains, then who receives it. */
export function sheetSteps({ form, options, nameLabel, text }: SheetStepsInput) {
  const steps: WizardStepDef<SheetDefinitionFormValues>[] = [
    {
      ...text({ id: "name" }),
      fields: ["name"],
      content: <TextField form={form} name="name" label={nameLabel} required />,
    },
    {
      ...text({ id: "content" }),
      fields: ["entityTypeIds", "fieldIds", "vocabularyIds"],
      content: <SheetContentFields form={form} options={options} />,
    },
    {
      ...text({ id: "receiver" }),
      fields: ["roleId"],
      content: <SheetRoleField form={form} roles={options.roles} />,
    },
  ];
  return steps;
}
