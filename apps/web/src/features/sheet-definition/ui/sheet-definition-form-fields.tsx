import type { SheetDefinitionCreateInput } from "@bibi/core";
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
import type { SheetDefinitionFormValues } from "./sheet-definition-form-schema";
import { fieldsOfTypes, type SheetOption, type SheetOptions } from "./sheet-options";

type SheetForm = UseFormReturn<SheetDefinitionFormValues, unknown, SheetDefinitionCreateInput>;
type IdsName = "entityTypeIds" | "fieldIds" | "vocabularyIds";

const toChoices = ({ options }: { options: readonly SheetOption[] }) =>
  options.map(({ id, name }) => ({ value: id, label: name }));

type IdsFieldProps = {
  form: SheetForm;
  name: IdsName;
  options: readonly SheetOption[];
  onPick?: (input: { ids: string[] }) => void;
};

/** Checkboxes for one of the definition's id sets. */
function IdsField({ form, name, options, onPick }: IdsFieldProps) {
  const t = useTranslations("sheetDefinition");
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

export type SheetResponsibilityFieldProps = {
  form: SheetForm;
  responsibilities: readonly SheetOption[];
};

export function SheetResponsibilityField({
  form,
  responsibilities,
}: SheetResponsibilityFieldProps) {
  const t = useTranslations("sheetDefinition");
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

export type SheetContentFieldsProps = { form: SheetForm; options: SheetOptions };

/** Item types, their fields and lists. Unpicking a type drops its fields. */
export function SheetContentFields({ form, options }: SheetContentFieldsProps) {
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

export type SheetDefinitionFormFieldsProps = { form: SheetForm; options: SheetOptions };

/** Content and receiving role in one form (the update page); create splits them into steps. */
export function SheetDefinitionFormFields({ form, options }: SheetDefinitionFormFieldsProps) {
  return (
    <>
      <SheetContentFields form={form} options={options} />
      <SheetResponsibilityField form={form} responsibilities={options.responsibilities} />
    </>
  );
}
