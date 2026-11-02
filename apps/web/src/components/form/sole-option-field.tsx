"use client";

import { useEffect } from "react";
import { type Control, type FieldValues, type Path, useController } from "react-hook-form";

export type SoleOptionFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  /** The only choice there is. */
  id: string;
  /** Called once the field takes the choice, as a picked value would be. */
  onChange?: ((value: string) => void) | undefined;
};

/**
 * A field with one possible choice is not shown: an empty one takes that choice by itself, and a
 * set value (e.g. an archived option on an edit form) is kept as it is.
 */
export function SoleOptionField<V extends FieldValues, O>({
  control,
  name,
  id,
  onChange,
}: SoleOptionFieldProps<V, O>) {
  const { field } = useController({ control, name });
  const current = String(field.value ?? "");
  useEffect(() => {
    if (current !== "") return;
    field.onChange(id);
    onChange?.(id);
  }, [current, id, field, onChange]);
  return null;
}
