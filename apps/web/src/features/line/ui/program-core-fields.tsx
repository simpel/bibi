import type { LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { BufferFields } from "@/components/form/buffer-fields";
import { NONE } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";
import type { ItemLock } from "./program-item-field";
import { ProgramPlaceFields } from "./program-place-fields";
import { ProgramPriceFields } from "./program-price-fields";

export type ProgramCoreFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
  /** The line being edited: what it inherits shows as the empty fields' placeholders. */
  line?: LineDto | undefined;
  /** Why the line's item cannot change here, if it cannot. */
  itemLock?: ItemLock;
};

const placeholder = ({ value }: { value: number | null }) =>
  value === null ? undefined : String(value);

/**
 * Name, time (both empty: untimed), the item and its buffers, quantity, prices and the note.
 * An empty field inherits (ADR 0051, 0052, 0059); what it inherits now is its placeholder, never
 * its value, so a save does not copy the default onto the line.
 */
export function ProgramCoreFields({ form, data, line, itemLock }: ProgramCoreFieldsProps) {
  const t = useTranslations("line");
  const itemId = form.watch("itemId");
  // What the line inherits is known only while it keeps its item.
  const known = line && itemId === (line.itemId ?? NONE) ? line : undefined;
  return (
    <>
      <TextField form={form} name="name" label={t("fields.name")} required />
      <DateTimeField form={form} name="startsAt" label={t("fields.startsAt")} />
      <DateTimeField form={form} name="endsAt" label={t("fields.endsAt")} />
      <ProgramPlaceFields form={form} data={data} itemLock={itemLock} />
      {itemId === NONE ? null : (
        <BufferFields
          form={form}
          inherited={
            known
              ? {
                  setupMinutes: known.effectiveSetupMinutes,
                  teardownMinutes: known.effectiveTeardownMinutes,
                }
              : undefined
          }
        />
      )}
      <TextField
        form={form}
        name="quantity"
        label={t("fields.quantity")}
        type="number"
        placeholder={placeholder({ value: known?.effectiveQuantity ?? null })}
      />
      <ProgramPriceFields form={form} inherited={known} />
      <TextField form={form} name="note" label={t("fields.note")} multiline />
    </>
  );
}
