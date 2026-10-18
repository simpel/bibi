import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { SetupForm } from "./setup-form";
import { StateFields } from "./state-fields";
import { StateTemplateField } from "./state-template-field";

export type TypeStatesFieldsProps = { form: SetupForm; index: number };

const NEW_STATE = {
  color: "#64748b",
  initial: false,
  hold: "NONE" as const,
  inSheets: false,
  released: false,
  expires: false,
};

/** One item type's states: a template to start from, the states in order and the expiry state. */
export function TypeStatesFields({ form, index }: TypeStatesFieldsProps) {
  const t = useTranslations("pipelineSetup.states");
  const base = `itemTypes.${index}` as const;
  const states = useFieldArray({ control: form.control, name: `${base}.states` });
  const type = form.watch(base);
  const names = type.states.map((state) => ({ id: state.name, name: state.name }));
  const removable = states.fields.length > 1;
  return (
    <section className="grid gap-3 rounded-lg border p-4" aria-label={type.name}>
      <h3 className="font-medium">{type.name}</h3>
      <StateTemplateField form={form} index={index} replaceStates={states.replace} />
      {states.fields.map((field, position) => (
        <StateFields
          key={field.id}
          form={form}
          name={`${base}.states.${position}`}
          bookable={type.bookable}
          onRemove={removable ? () => states.remove(position) : undefined}
        />
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => states.append({ ...NEW_STATE, name: t("newStateName") })}
        >
          {t("add")}
        </Button>
      </div>
      <OptionSelectField
        control={form.control}
        name={`${base}.expiryState`}
        label={t("expiryState")}
        options={names}
        noneLabel={t("noExpiry")}
      />
    </section>
  );
}
