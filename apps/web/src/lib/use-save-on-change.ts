import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type UseSaveOnChangeInput<V extends FieldValues, T> = {
  form: UseFormReturn<V, unknown, T>;
  /** `useFormAction`'s `run`: the whole form is sent as one update. */
  run: (input: { values: T }) => void;
  /** Skip a save while the values are not ready yet (e.g. "only these" with none picked). */
  ready?: ((input: { values: V }) => boolean) | undefined;
};

/**
 * A form of easy-to-undo choices (selects, switches, checkboxes) that saves on every change the
 * user makes, through `useFormAction` and its toast (CLAUDE.md "Forms"): no Save button. A reset
 * after a save or an error does not save again.
 */
export function useSaveOnChange<V extends FieldValues, T>({
  form,
  run,
  ready,
}: UseSaveOnChangeInput<V, T>) {
  const latest = useRef({ run, ready });
  latest.current = { run, ready };
  useEffect(() => {
    const subscription = form.watch((values, { type }) => {
      if (type !== "change") return;
      if (latest.current.ready && !latest.current.ready({ values: values as V })) return;
      void form.handleSubmit((output) => latest.current.run({ values: output }))();
    });
    return () => subscription.unsubscribe();
  }, [form]);
}
