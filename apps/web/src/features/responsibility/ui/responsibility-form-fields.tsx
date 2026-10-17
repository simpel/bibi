import type { ResponsibilityCreateInput } from "@okazi/core";
import {
  ChoiceControl,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  MultiChoiceControl,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { ResponsibilityFormValues } from "./responsibility-form-schema";
import type { ResponsibilityOption, ResponsibilityOptions } from "./responsibility-options";

type ResponsibilityForm = UseFormReturn<
  ResponsibilityFormValues,
  unknown,
  ResponsibilityCreateInput
>;

const toChoices = ({ options }: { options: readonly ResponsibilityOption[] }) =>
  options.map(({ id, name }) => ({ value: id, label: name }));

type IdsFieldProps = {
  form: ResponsibilityForm;
  name: "entityTypeIds" | "defaultFollowerIds";
  options: readonly ResponsibilityOption[];
};

/** Checkboxes for one of the responsibility's id sets. */
function IdsField({ form, name, options }: IdsFieldProps) {
  const t = useTranslations("responsibility");
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
              onChange={field.onChange}
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

type AssigneeFieldProps = { form: ResponsibilityForm; people: readonly ResponsibilityOption[] };

function AssigneeField({ form, people }: AssigneeFieldProps) {
  const t = useTranslations("responsibility");
  return (
    <FormController
      control={form.control}
      name="defaultAssigneeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t("fields.defaultAssigneeId")}
            <span className="ml-0.5 text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <ChoiceControl
              value={field.value}
              onChange={field.onChange}
              choices={toChoices({ options: people })}
              placeholder={t("selectPerson")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type ResponsibilityFormFieldsProps = {
  form: ResponsibilityForm;
  options: ResponsibilityOptions;
};

/** Covered item types, default assignee and default followers. */
export function ResponsibilityFormFields({ form, options }: ResponsibilityFormFieldsProps) {
  return (
    <>
      <IdsField form={form} name="entityTypeIds" options={options.types} />
      <AssigneeField form={form} people={options.people} />
      <IdsField form={form} name="defaultFollowerIds" options={options.people} />
    </>
  );
}
