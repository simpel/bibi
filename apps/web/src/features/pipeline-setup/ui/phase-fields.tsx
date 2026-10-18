import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import type { SetupForm } from "./setup-form";

export type PhaseFieldsProps = {
  form: SetupForm;
  index: number;
  onUp: (() => void) | undefined;
  onDown: (() => void) | undefined;
  onRemove: (() => void) | undefined;
};

const QUESTIONS = [
  "entry",
  "terminal",
  "requiresReason",
  "requiresAssignee",
  "invoiceable",
] as const;

/** One phase: name, color and each flag as a yes/no question. */
export function PhaseFields({ form, index, onUp, onDown, onRemove }: PhaseFieldsProps) {
  const t = useTranslations("pipelineSetup.phases");
  const name = `phases.${index}` as const;
  const actions = [
    { key: "moveUp", run: onUp },
    { key: "moveDown", run: onDown },
    { key: "remove", run: onRemove },
  ] as const;
  return (
    <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
      <legend className="sr-only">{form.watch(`${name}.name`)}</legend>
      <TextField form={form} name={`${name}.name`} label={t("name")} required />
      <TextField form={form} name={`${name}.color`} label={t("color")} type="color" />
      <div className="grid gap-2 sm:col-span-2">
        {QUESTIONS.map((flag) => (
          <CheckField
            key={flag}
            form={form}
            name={`${name}.${flag}`}
            label={t(`questions.${flag}`)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        {actions.map(({ key, run }) =>
          run ? (
            <Button key={key} type="button" variant="outline" size="sm" onClick={run}>
              {t(key)}
            </Button>
          ) : null,
        )}
      </div>
    </fieldset>
  );
}
