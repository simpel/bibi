import type { FieldDefinitionDto } from "@bibi/core";
import {
  BooleanControl,
  ChoiceControl,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  LinkControl,
  MultiChoiceControl,
  NumberControl,
  TextControl,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Control, Path } from "react-hook-form";
import { PlainDateButton } from "@/components/date-picker/plain-date-button";
import { useCan } from "@/components/shell/permissions-context";
import { CreateListValueDialog } from "./create-list-value-dialog";
import type { FieldChoice } from "./field-specs";
import type { WithRawFields } from "./raw-fields";

export type FieldControllerProps<V extends WithRawFields, O> = {
  control: Control<V, unknown, O>;
  field: FieldDefinitionDto;
  choices: FieldChoice[];
  /** The list a CHOICE field takes its values from: lets list editors create a value here. */
  list?: { id: string; name: string } | undefined;
};

/** One of the type's own fields, rendered by its kind (name `fields.<key>`, so server issues land here). */
export function FieldController<V extends WithRawFields, O>({
  control,
  field,
  choices,
  list,
}: FieldControllerProps<V, O>) {
  const { key, kind, name, required } = field;
  const t = useTranslations("common");
  const canCreate = useCan({ permission: "configuration:write" }) && kind === "CHOICE" && !!list;
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<FieldChoice[]>([]);
  const known = new Set(choices.map(({ value }) => value));
  const offered = [...choices, ...created.filter(({ value }) => !known.has(value))];
  const labels = {
    placeholder: t("select"),
    emptyLabel: t("noOptions"),
    search: t("search"),
    noMatches: t("noMatches"),
    createValue: t("listValue.create"),
  };
  return (
    <FormController
      control={control}
      name={`fields.${key}` as Path<V>}
      render={({ field: controlled }) => {
        const label = (
          <FormLabel>
            {name}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
        );
        const input = (
          <FormControl>
            {renderControl({
              kind,
              choices: offered,
              labels,
              value: controlled.value,
              onChange: controlled.onChange,
              ...(canCreate ? { onCreate: () => setCreating(true) } : {}),
            })}
          </FormControl>
        );
        const dialog =
          canCreate && list ? (
            <CreateListValueDialog
              list={list}
              open={creating}
              onOpenChange={setCreating}
              onCreated={({ value }) => {
                setCreated((current) => [...current, { value: value.id, label: value.name }]);
                controlled.onChange(value.id);
              }}
            />
          ) : null;
        // A yes/no field is a switch with its label beside it, like a setting.
        return kind === "BOOLEAN" ? (
          <FormItem>
            <div className="flex items-center gap-3">
              {input}
              {label}
            </div>
            <FormMessage />
          </FormItem>
        ) : (
          <FormItem>
            {label}
            {input}
            <FormMessage />
            {dialog}
          </FormItem>
        );
      }}
    />
  );
}

type RenderInput = {
  kind: FieldDefinitionDto["kind"];
  choices: FieldChoice[];
  labels: {
    placeholder: string;
    emptyLabel: string;
    search: string;
    noMatches: string;
    createValue: string;
  };
  /** CHOICE from a list the caller may change: a last "Create value" entry. */
  onCreate?: () => void;
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
function renderControl({ kind, choices, labels, value, onChange, onCreate }: RenderInput) {
  const common = { onChange };
  switch (kind) {
    case "TEXT":
      return <TextControl value={String(value ?? "")} {...common} />;
    case "NUMBER":
      return <NumberControl value={String(value ?? "")} {...common} />;
    case "DATE":
      return <PlainDateButton value={String(value ?? "")} clearable {...common} />;
    case "BOOLEAN":
      return <BooleanControl value={value === true} {...common} />;
    case "CHOICE":
      return (
        <ChoiceControl
          value={String(value ?? "")}
          choices={choices}
          placeholder={labels.placeholder}
          {...(onCreate ? { createLabel: labels.createValue, onCreate } : {})}
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
