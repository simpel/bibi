import type { LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { BufferFields } from "@/components/form/buffer-fields";
import { NONE } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";
import { ProgramPlaceFields } from "./program-place-fields";
import { ProgramPriceFields } from "./program-price-fields";

export type ProgramCoreFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
  /** The line being edited: its buffers in effect are shown under the buffer fields. */
  line?: Pick<LineDto, "effectiveSetupMinutes" | "effectiveTeardownMinutes"> | undefined;
};

/** Name, time (both empty: untimed), where and its buffers, quantity, prices and the note. */
export function ProgramCoreFields({ form, data, line }: ProgramCoreFieldsProps) {
  const t = useTranslations("line");
  const time = { form, type: "datetime-local" } as const;
  return (
    <>
      <TextField form={form} name="name" label={t("fields.name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField {...time} name="startsAt" label={t("fields.startsAt")} />
        <TextField {...time} name="endsAt" label={t("fields.endsAt")} />
      </div>
      <ProgramPlaceFields form={form} data={data} />
      {form.watch("itemId") === NONE ? null : (
        <BufferFields
          form={form}
          inherits="item"
          inherited={
            line
              ? {
                  setupMinutes: line.effectiveSetupMinutes,
                  teardownMinutes: line.effectiveTeardownMinutes,
                }
              : undefined
          }
        />
      )}
      <TextField form={form} name="quantity" label={t("fields.quantity")} type="number" />
      <ProgramPriceFields form={form} />
      <TextField form={form} name="note" label={t("fields.note")} multiline />
    </>
  );
}
