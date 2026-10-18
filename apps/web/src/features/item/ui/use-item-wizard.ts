import { useWizard } from "@/components/wizard/use-wizard";
import { STEP_FIELDS, stepsFor } from "./item-wizard-steps";
import { type UseItemFormInput, useItemForm } from "./use-item-form";

export type UseItemWizardInput = Pick<UseItemFormInput, "data" | "typeId" | "onDone">;

/** The item form as steps: Next validates the step, a failed save jumps to the error. */
export function useItemWizard({ typeId, ...rest }: UseItemWizardInput) {
  const { form, run, pending, typeOf } = useItemForm({ typeId, ...rest });
  const type = typeOf({ id: form.watch("entityTypeId") });
  const steps = stepsFor({ type });
  const wizard = useWizard({
    form,
    steps,
    fieldsOf: ({ step }) => STEP_FIELDS[step],
    startIndex: typeId ? 1 : 0,
    run,
  });
  return { ...wizard, form, type, steps, pending, typeOf };
}
