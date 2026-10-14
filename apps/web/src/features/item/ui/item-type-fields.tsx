import type { EntityTypeDto } from "@okazi/core";
import type { Control } from "react-hook-form";
import { choicesOf } from "./field-specs";
import { FieldController } from "./fields/field-controller";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type ItemTypeFieldsProps = {
  control: Control<ItemFormValues, unknown, ItemFormOutput>;
  type: EntityTypeDto;
  vocabularies: ItemFormData["vocabularies"];
};

/** The type's own fields, each rendered by its kind. */
export function ItemTypeFields({ control, type, vocabularies }: ItemTypeFieldsProps) {
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
