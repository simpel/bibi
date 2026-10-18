import { useTranslations } from "next-intl";
import type { SetupForm } from "./setup-form";
import { TypeStatesFields } from "./type-states-fields";

export type StatesStepProps = { form: SetupForm };

/** Step 2: the states of each item type, started from a template. */
export function StatesStep({ form }: StatesStepProps) {
  const t = useTranslations("pipelineSetup.states");
  const types = form.watch("itemTypes");
  if (types.length === 0) return <p className="text-sm text-muted-foreground">{t("noTypes")}</p>;
  return (
    <div className="grid gap-6">
      {types.map((type, index) => (
        <TypeStatesFields key={type.entityTypeId || `new-${type.name}`} form={form} index={index} />
      ))}
    </div>
  );
}
