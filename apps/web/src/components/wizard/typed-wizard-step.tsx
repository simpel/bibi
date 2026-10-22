import type { EntityTypeDto } from "@bibi/core";
import type { ReactNode } from "react";
import type { Control, FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";
import { rawFields, type WithRawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { TypedStep } from "./typed-steps";

export type TypedValues = FieldValues & WithRawFields & { entityTypeId: string };

export type TypedWizardStepProps<V extends TypedValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  step: TypedStep;
  type: EntityTypeDto | undefined;
  data: TypedFormData;
  typeOf: (input: { id: string }) => EntityTypeDto | undefined;
  typeLabel: string;
  core: ReactNode;
};

/** The content of one step: the type picker, the record's details, or the type's own fields. */
export function TypedWizardStep<V extends TypedValues, O>(props: TypedWizardStepProps<V, O>) {
  const { form, step, type, data, typeOf, typeLabel, core } = props;
  if (step === "details") return core;
  if (step === "fields") {
    return type ? (
      <TypeFields control={form.control as Control<V, unknown, O>} type={type} data={data} />
    ) : null;
  }
  return (
    <TypeSelectField
      control={form.control}
      types={data.types}
      label={typeLabel}
      onTypeChange={(id) =>
        form.setValue(
          "fields" as Path<V>,
          rawFields({ type: typeOf({ id }), stored: {} }) as PathValue<V, Path<V>>,
        )
      }
    />
  );
}
