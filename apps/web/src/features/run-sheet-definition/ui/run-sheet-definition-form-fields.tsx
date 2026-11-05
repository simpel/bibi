import type { RunSheetDefinitionCreateInput } from "@bibi/core";
import {
  ChoiceControl,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  MultiChoiceControl,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { RunSheetDefinitionFormValues } from "./run-sheet-definition-form-schema";
import { fieldsOfTypes, type RunSheetOption, type RunSheetOptions } from "./run-sheet-options";

type RunSheetForm = UseFormReturn<
  RunSheetDefinitionFormValues,
  unknown,
  RunSheetDefinitionCreateInput
>;
type IdsName = "entityTypeIds" | "fieldIds" | "vocabularyIds";

const toChoices = ({ options }: { options: readonly RunSheetOption[] }) =>
  options.map(({ id, name }) => ({ value: id, label: name }));

type IdsFieldProps = {
  form: RunSheetForm;
  name: IdsName;
  options: readonly RunSheetOption[];
  onPick?: (input: { ids: string[] }) => void;
};

/** Checkboxes for one of the definition's id sets. */
function IdsField({ form, name, options, onPick }: IdsFieldProps) {
  const t = useTranslations("runSheetDefinition");
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(`fields.${name}`)}</FormLabel>
          <FormDescription>{t(`hints.${name}`)}</FormDescription>
          <FormControl>
            <MultiChoiceControl
              value={field.value}
              onChange={(ids) => {
                field.onChange(ids);
                onPick?.({ ids });
              }}
              choices={toChoices({ options })}
              emptyLabel={t(`none.${name}`)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type RunSheetResponsibilityFieldProps = {
  form: RunSheetForm;
  responsibilities: readonly RunSheetOption[];
};

export function RunSheetResponsibilityField({
  form,
  responsibilities,
}: RunSheetResponsibilityFieldProps) {
  const t = useTranslations("runSheetDefinition");
  return (
    <FormController
      control={form.control}
      name="responsibilityId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t("fields.responsibilityId")}
            <span className="ml-0.5 text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <ChoiceControl
              value={field.value}
              onChange={field.onChange}
              choices={toChoices({ options: responsibilities })}
              placeholder={t("selectResponsibility")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type RunSheetContentFieldsProps = { form: RunSheetForm; options: RunSheetOptions };

/** Item types, their fields and lists. Unpicking a type drops its fields. */
export function RunSheetContentFields({ form, options }: RunSheetContentFieldsProps) {
  const typeIds = form.watch("entityTypeIds");
  const fields = fieldsOfTypes({ types: options.types, typeIds });
  const pruneFields = ({ ids }: { ids: string[] }) => {
    const allowed = fieldsOfTypes({ types: options.types, typeIds: ids }).map(({ id }) => id);
    form.setValue(
      "fieldIds",
      form.getValues("fieldIds").filter((id) => allowed.includes(id)),
    );
  };
  return (
    <>
      <IdsField form={form} name="entityTypeIds" options={options.types} onPick={pruneFields} />
      <IdsField form={form} name="fieldIds" options={fields} />
      <IdsField form={form} name="vocabularyIds" options={options.lists} />
    </>
  );
}

export type RunSheetDefinitionFormFieldsProps = { form: RunSheetForm; options: RunSheetOptions };

/** Content and receiving role in one form (the update page); create splits them into steps. */
export function RunSheetDefinitionFormFields({ form, options }: RunSheetDefinitionFormFieldsProps) {
  return (
    <>
      <RunSheetContentFields form={form} options={options} />
      <RunSheetResponsibilityField form={form} responsibilities={options.responsibilities} />
    </>
  );
}
