import { HOLD_KINDS, type ItemStateCreateInput, STATE_FLAGS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { ItemStateFormValues } from "./item-state-form-schema";

export type ItemStateFlagFieldsProps = {
  form: UseFormReturn<ItemStateFormValues, unknown, ItemStateCreateInput>;
  /** Only bookable types can hold their items, so only they get the hold choice. */
  bookable: boolean;
};

/** The hold kind (bookable types) and one checkbox per state flag, each a plain choice. */
export function ItemStateFlagFields({ form, bookable }: ItemStateFlagFieldsProps) {
  const t = useTranslations("itemState");
  return (
    <>
      {bookable ? (
        <OptionSelectField
          control={form.control}
          name="hold"
          label={t("fields.hold")}
          options={HOLD_KINDS.map((id) => ({ id, name: t(`holds.${id}`) }))}
        />
      ) : null}
      <fieldset className="grid gap-2">
        {STATE_FLAGS.map((flag) => (
          <CheckField key={flag} form={form} name={flag} label={t(`flagChoices.${flag}`)} />
        ))}
      </fieldset>
    </>
  );
}
