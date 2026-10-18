import {
  PIPELINE_TEMPLATE_KEYS,
  type PipelineTemplateKey,
} from "@okazi/core/pipeline-setup-templates";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { templateValues } from "./setup-defaults";
import type { SetupForm } from "./setup-form";

export type PhaseTemplateFieldProps = {
  form: SetupForm;
  /** Replaces the phases with the template's. */
  replacePhases: (phases: ReturnType<typeof templateValues>["phases"]) => void;
};

/** A phase template: choosing one replaces the phases and refills the grid. */
export function PhaseTemplateField({ form, replacePhases }: PhaseTemplateFieldProps) {
  const t = useTranslations("pipelineSetup.phases");
  const apply = ({ value }: { value: string }) => {
    const itemTypes = form.getValues("itemTypes");
    const next = templateValues({ template: value as PipelineTemplateKey, itemTypes });
    replacePhases(next.phases);
    form.setValue("cells", next.cells);
  };
  return (
    <OptionSelectField
      control={form.control}
      name="template"
      label={t("template")}
      options={PIPELINE_TEMPLATE_KEYS.map((id) => ({ id, name: t(`templates.${id}`) }))}
      onChange={(value) => apply({ value })}
    />
  );
}
