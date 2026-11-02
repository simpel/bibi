import type { WorkOrderDefinitionCreateInput } from "@bibi/core";
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
import type { WorkOrderDefinitionFormValues } from "./work-order-definition-form-schema";
import { fieldsOfTypes, type WorkOrderOption, type WorkOrderOptions } from "./work-order-options";

type WorkOrderForm = UseFormReturn<
  WorkOrderDefinitionFormValues,
  unknown,
  WorkOrderDefinitionCreateInput
>;
type IdsName = "entityTypeIds" | "fieldIds" | "vocabularyIds";

const toChoices = ({ options }: { options: readonly WorkOrderOption[] }) =>
  options.map(({ id, name }) => ({ value: id, label: name }));

type IdsFieldProps = {
  form: WorkOrderForm;
  name: IdsName;
  options: readonly WorkOrderOption[];
  onPick?: (input: { ids: string[] }) => void;
};

/** Checkboxes for one of the definition's id sets. */
function IdsField({ form, name, options, onPick }: IdsFieldProps) {
  const t = useTranslations("workOrderDefinition");
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

export type WorkOrderResponsibilityFieldProps = {
  form: WorkOrderForm;
  responsibilities: readonly WorkOrderOption[];
};

export function WorkOrderResponsibilityField({
  form,
  responsibilities,
}: WorkOrderResponsibilityFieldProps) {
  const t = useTranslations("workOrderDefinition");
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

export type WorkOrderContentFieldsProps = { form: WorkOrderForm; options: WorkOrderOptions };

/** Item types, their fields and lists. Unpicking a type drops its fields. */
export function WorkOrderContentFields({ form, options }: WorkOrderContentFieldsProps) {
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

export type WorkOrderDefinitionFormFieldsProps = { form: WorkOrderForm; options: WorkOrderOptions };

/** Content and receiving role in one form (the update page); create splits them into steps. */
export function WorkOrderDefinitionFormFields({
  form,
  options,
}: WorkOrderDefinitionFormFieldsProps) {
  return (
    <>
      <WorkOrderContentFields form={form} options={options} />
      <WorkOrderResponsibilityField form={form} responsibilities={options.responsibilities} />
    </>
  );
}
