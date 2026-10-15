import type { FieldDefinitionDto } from "@okazi/core";
import {
  BooleanControl,
  ChoiceControl,
  DateControl,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  LinkControl,
  MultiChoiceControl,
  NumberControl,
  TextControl,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { Control, Path } from "react-hook-form";
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
  const t = useTranslations("common");
  const labels = {
    placeholder: t("select"),
    emptyLabel: t("noOptions"),
    search: t("search"),
    noMatches: t("noMatches"),
  };
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
              labels,
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
  labels: { placeholder: string; emptyLabel: string; search: string; noMatches: string };
  value: unknown;
  onChange: (value: unknown) => void;
};

type RenderLinkInput = Omit<RenderInput, "kind">;

/** LINK: a searchable pick of one record of the target type. */
function renderLink({ choices, labels, value, onChange }: RenderLinkInput) {
  return (
    <LinkControl
      value={String(value ?? "")}
      choices={choices}
      placeholder={labels.placeholder}
      searchPlaceholder={labels.search}
      emptyText={labels.noMatches}
      onChange={onChange}
    />
  );
}

/** The UI control of a field kind, bound to the form through `value` and `onChange`. */
function renderControl({ kind, choices, labels, value, onChange }: RenderInput) {
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
      return (
        <ChoiceControl
          value={String(value ?? "")}
          choices={choices}
          placeholder={labels.placeholder}
          {...common}
        />
      );
    case "LINK":
      return renderLink({ choices, labels, value, onChange });
    case "MULTI_CHOICE":
      return (
        <MultiChoiceControl
          value={Array.isArray(value) ? (value as string[]) : []}
          choices={choices}
          emptyLabel={labels.emptyLabel}
          {...common}
        />
      );
  }
}
