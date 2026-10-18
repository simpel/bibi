import {
  STATE_TEMPLATE_CHOICES,
  type StateTemplateChoice,
  statesFromTemplate,
} from "@okazi/core/pipeline-setup-templates";
import { useTranslations } from "next-intl";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import type { SetupForm } from "./setup-form";
import type { SetupStateValues } from "./setup-form-schema";

export type StateTemplateFieldProps = {
  form: SetupForm;
  index: number;
  /** Replaces the type's states with the template's. */
  replaceStates: (states: SetupStateValues[]) => void;
};

/** A state template for one type: choosing one replaces its states and expiry state. */
export function StateTemplateField({ form, index, replaceStates }: StateTemplateFieldProps) {
  const t = useTranslations("pipelineSetup.states");
  const base = `itemTypes.${index}` as const;
  const apply = ({ value }: { value: string }) => {
    const bookable = form.getValues(`${base}.bookable`);
    const built = statesFromTemplate({ template: value as StateTemplateChoice, bookable });
    replaceStates(built.states);
    form.setValue(`${base}.expiryState`, built.expiryState ?? NONE);
  };
  return (
    <OptionSelectField
      control={form.control}
      name={`${base}.stateTemplate`}
      label={t("template")}
      options={STATE_TEMPLATE_CHOICES.map((id) => ({ id, name: t(`templates.${id}`) }))}
      onChange={(value) => apply({ value })}
    />
  );
}
