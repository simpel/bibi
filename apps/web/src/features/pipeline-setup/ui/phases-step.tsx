import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { PhaseFields } from "./phase-fields";
import { PhaseTemplateField } from "./phase-template-field";
import type { SetupForm } from "./setup-form";

export type PhasesStepProps = { form: SetupForm };

const NEW_PHASE = {
  color: "#64748b",
  entry: false,
  terminal: false,
  requiresReason: false,
  requiresAssignee: false,
  invoiceable: false,
};

/** Step 3: the phases in order, from a template; the flags are asked as plain questions. */
export function PhasesStep({ form }: PhasesStepProps) {
  const t = useTranslations("pipelineSetup.phases");
  const { fields, append, remove, move, replace } = useFieldArray({
    control: form.control,
    name: "phases",
  });
  const last = fields.length - 1;
  return (
    <div className="grid gap-4">
      <PhaseTemplateField form={form} replacePhases={replace} />
      {fields.map((field, index) => (
        <PhaseFields
          key={field.id}
          form={form}
          index={index}
          onUp={index > 0 ? () => move(index, index - 1) : undefined}
          onDown={index < last ? () => move(index, index + 1) : undefined}
          onRemove={last > 0 ? () => remove(index) : undefined}
        />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ ...NEW_PHASE, name: t("newPhaseName") })}
        >
          {t("add")}
        </Button>
      </div>
    </div>
  );
}
