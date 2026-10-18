import { useState } from "react";
import type { FieldErrors, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

export type UseWizardInput<V extends FieldValues, O, S extends string> = {
  form: UseFormReturn<V, unknown, O>;
  /** The steps in order; the last one saves. */
  steps: S[];
  /** The form fields shown on a step: Next validates them, a failed save jumps to the first with an error. */
  fieldsOf: (input: { step: S }) => FieldPath<V>[];
  startIndex?: number;
  run: (input: { values: O }) => void;
};

/** Step state on top of a react-hook-form form; steps come from the form values, so they can change. */
export function useWizard<V extends FieldValues, O, S extends string>({
  form,
  steps,
  fieldsOf,
  startIndex = 0,
  run,
}: UseWizardInput<V, O, S>) {
  const [requested, setIndex] = useState(startIndex);
  const index = Math.min(requested, steps.length - 1);
  const step = steps[index] as S;
  const next = async () => {
    if (await form.trigger(fieldsOf({ step }))) setIndex(index + 1);
  };
  const jumpToError = ({ errors }: { errors: FieldErrors<V> }) => {
    const target = steps.findIndex((candidate) =>
      fieldsOf({ step: candidate }).some((name) => name in errors),
    );
    if (target >= 0) setIndex(target);
  };
  const submit = form.handleSubmit(
    (values) => run({ values }),
    (errors) => jumpToError({ errors }),
  );
  return { step, index, isLast: index === steps.length - 1, next, submit, setIndex };
}
