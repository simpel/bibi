import type { EntityTypeDto } from "@okazi/core";
import type { FieldPath, Path, UseFormReturn } from "react-hook-form";
import { typedStepFields, typedStepsFor } from "./typed-steps";
import type { TypedValues } from "./typed-wizard-step";
import { useWizard } from "./use-wizard";

export type UseTypedWizardInput<V extends TypedValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  typeOf: (input: { id: string }) => EntityTypeDto | undefined;
  coreFields: FieldPath<V>[];
  typeChosen: boolean;
  run: (input: { values: O }) => void;
};

/** Steps of a typed create: the picked type decides whether the own-fields step exists. */
export function useTypedWizard<V extends TypedValues, O>({
  form,
  typeOf,
  coreFields,
  typeChosen,
  run,
}: UseTypedWizardInput<V, O>) {
  const type = typeOf({ id: form.watch("entityTypeId" as Path<V>) as string });
  const steps = typedStepsFor({ type });
  const wizard = useWizard({
    form,
    steps,
    fieldsOf: ({ step }) => typedStepFields({ step, coreFields }),
    startIndex: typeChosen ? 1 : 0,
    run,
  });
  return { ...wizard, type, steps };
}
