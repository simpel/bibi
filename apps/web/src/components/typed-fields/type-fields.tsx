import type { EntityTypeDto, VocabularyDto } from "@okazi/core";
import type { Control } from "react-hook-form";
import { FieldController } from "./field-controller";
import { choicesOf } from "./field-specs";
import type { WithRawFields } from "./raw-fields";

export type TypeFieldsProps<V extends WithRawFields, O> = {
  control: Control<V, unknown, O>;
  type: EntityTypeDto;
  vocabularies: VocabularyDto[];
};

/** A type's own fields (ADR 0021), each rendered by its kind. Used by every typed record form. */
export function TypeFields<V extends WithRawFields, O>({
  control,
  type,
  vocabularies,
}: TypeFieldsProps<V, O>) {
  return (
    <>
      {type.fields.map((field) => (
        <FieldController
          key={field.id}
          control={control}
          field={field}
          choices={choicesOf({ field, vocabularies }) ?? []}
        />
      ))}
    </>
  );
}
