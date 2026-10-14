"use client";

import { Checkbox, Label } from "@okazi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";

export type CheckFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
};

/** Boolean field rendered with the ui Checkbox. */
export function CheckField<V extends FieldValues, O>({ form, name, label }: CheckFieldProps<V, O>) {
  const id = `field-${name}`;
  return (
    <div className="flex items-center gap-2">
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Checkbox id={id} checked={field.value === true} onCheckedChange={field.onChange} />
        )}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
