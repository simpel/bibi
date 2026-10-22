import type { EntityTypeDto } from "@bibi/core";
import type { Control } from "react-hook-form";
import { FieldController } from "./field-controller";
import { choicesOf } from "./field-specs";
import type { WithRawFields } from "./raw-fields";
import type { TypedFormData } from "./typed-form-data";

export type TypeFieldsProps<V extends WithRawFields, O> = {
  control: Control<V, unknown, O>;
  type: EntityTypeDto;
  /** Lists choice fields use and records LINK fields can point to. */
  data: Pick<TypedFormData, "vocabularies" | "links">;
};

/** A type's own fields (ADR 0021), each rendered by its kind. Used by every typed record form. */
export function TypeFields<V extends WithRawFields, O>({
  control,
  type,
  data: { vocabularies, links },
}: TypeFieldsProps<V, O>) {
  return (
    <>
      {type.fields.map((field) => (
        <FieldController
          key={field.id}
          control={control}
          field={field}
          choices={choicesOf({ field, vocabularies, links }) ?? []}
        />
      ))}
    </>
  );
}
