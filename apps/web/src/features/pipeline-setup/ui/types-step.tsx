import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { AddTypeControls } from "./add-type-controls";
import type { SetupTypeOption } from "./setup-defaults";
import type { SetupForm } from "./setup-form";
import { TypeRow } from "./type-row";

export type TypesStepProps = { form: SetupForm; options: SetupTypeOption[] };

/** Step 1: which item types the pipeline covers; existing ones or new ones. */
export function TypesStep({ form, options }: TypesStepProps) {
  const t = useTranslations("pipelineSetup.types");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "itemTypes" });
  const used = new Set(fields.map((field) => field.entityTypeId).filter(Boolean));
  return (
    <div className="grid gap-4">
      {fields.length === 0 ? <p className="text-sm text-muted-foreground">{t("none")}</p> : null}
      {fields.map((field, index) => (
        <TypeRow
          key={field.id}
          form={form}
          index={index}
          type={field}
          onRemove={() => remove(index)}
        />
      ))}
      <AddTypeControls
        addable={options.filter((option) => !used.has(option.id))}
        onAdd={(type) => append(type)}
      />
    </div>
  );
}
