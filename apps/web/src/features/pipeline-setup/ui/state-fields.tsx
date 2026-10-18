import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { SetupForm } from "./setup-form";

/** The holds of ADR 0044, in order. */
const HOLD_KINDS = ["NONE", "SOFT", "HARD"] as const;

export type StateFieldsProps = {
  form: SetupForm;
  name: `itemTypes.${number}.states.${number}`;
  bookable: boolean;
  onRemove: (() => void) | undefined;
};

/** One state: name, color, hold (bookable types only) and its flags as plain choices. */
export function StateFields({ form, name, bookable, onRemove }: StateFieldsProps) {
  const t = useTranslations("pipelineSetup.states");
  const holds = HOLD_KINDS.map((id) => ({ id, name: t(`holds.${id}`) }));
  return (
    <fieldset className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2">
      <legend className="sr-only">{form.watch(`${name}.name`)}</legend>
      <TextField form={form} name={`${name}.name`} label={t("name")} required />
      <TextField form={form} name={`${name}.color`} label={t("color")} type="color" />
      {bookable ? (
        <OptionSelectField
          control={form.control}
          name={`${name}.hold`}
          label={t("hold")}
          options={holds}
        />
      ) : null}
      <div className="grid gap-2 sm:col-span-2">
        <CheckField form={form} name={`${name}.initial`} label={t("initial")} />
        <CheckField form={form} name={`${name}.inSheets`} label={t("inSheets")} />
        <CheckField form={form} name={`${name}.released`} label={t("released")} />
        <CheckField form={form} name={`${name}.expires`} label={t("expires")} />
      </div>
      {onRemove ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            {t("remove")}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
