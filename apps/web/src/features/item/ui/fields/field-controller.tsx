import type { FieldDefinitionDto } from "@okazi/core";
import { FormControl, FormController, FormItem, FormLabel, FormMessage } from "@okazi/ui";
import type { Control } from "react-hook-form";
import type { FieldChoice } from "../field-specs";
import type { ItemFormOutput } from "../item-form-schema";
import type { ItemFormValues } from "../item-form-values";
import { BooleanControl } from "./boolean-control";
import { ChoiceControl } from "./choice-control";
import { DateControl } from "./date-control";
import { MultiChoiceControl } from "./multi-choice-control";
import { NumberControl } from "./number-control";
import { TextControl } from "./text-control";

export type FieldControllerProps = {
  control: Control<ItemFormValues, unknown, ItemFormOutput>;
  field: FieldDefinitionDto;
  choices: FieldChoice[];
};

/** One of the type's own fields, rendered by its kind (name `fields.<key>`, so server issues land here). */
export function FieldController({ control, field, choices }: FieldControllerProps) {
  const { key, kind, name, required } = field;
  return (
    <FormController
      control={control}
      name={`fields.${key}`}
      render={({ field: controlled }) => (
        <FormItem>
          <FormLabel>
            {name}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            {renderControl({
              kind,
              choices,
              value: controlled.value,
              onChange: controlled.onChange,
            })}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type RenderInput = {
  kind: FieldDefinitionDto["kind"];
  choices: FieldChoice[];
  value: unknown;
  onChange: (value: unknown) => void;
};

function renderControl({ kind, choices, value, onChange }: RenderInput) {
  const common = { onChange };
  switch (kind) {
    case "TEXT":
      return <TextControl value={String(value ?? "")} {...common} />;
    case "NUMBER":
      return <NumberControl value={String(value ?? "")} {...common} />;
    case "DATE":
      return <DateControl value={String(value ?? "")} {...common} />;
    case "BOOLEAN":
      return <BooleanControl value={value === true} {...common} />;
    case "CHOICE":
      return <ChoiceControl value={String(value ?? "")} choices={choices} {...common} />;
    case "MULTI_CHOICE":
      return (
        <MultiChoiceControl
          value={Array.isArray(value) ? (value as string[]) : []}
          choices={choices}
          {...common}
        />
      );
  }
}
