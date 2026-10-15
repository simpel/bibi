import type { FieldDefinitionDto } from "@okazi/core";
import { FormControl, FormController, FormItem, FormLabel, FormMessage } from "@okazi/ui";
import type { Control, Path } from "react-hook-form";
import { BooleanControl } from "./controls/boolean-control";
import { ChoiceControl } from "./controls/choice-control";
import { DateControl } from "./controls/date-control";
import { MultiChoiceControl } from "./controls/multi-choice-control";
import { NumberControl } from "./controls/number-control";
import { TextControl } from "./controls/text-control";
import type { FieldChoice } from "./field-specs";
import type { WithRawFields } from "./raw-fields";

export type FieldControllerProps<V extends WithRawFields, O> = {
  control: Control<V, unknown, O>;
  field: FieldDefinitionDto;
  choices: FieldChoice[];
};

/** One of the type's own fields, rendered by its kind (name `fields.<key>`, so server issues land here). */
export function FieldController<V extends WithRawFields, O>({
  control,
  field,
  choices,
}: FieldControllerProps<V, O>) {
  const { key, kind, name, required } = field;
  return (
    <FormController
      control={control}
      name={`fields.${key}` as Path<V>}
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
