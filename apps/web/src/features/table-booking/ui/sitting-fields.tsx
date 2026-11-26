import { useTranslations } from "next-intl";
import { DateField } from "@/components/date-picker/date-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import type { LayoutOption } from "../lib/sitting-row";
import { SittingTurnTimes } from "./sitting-turn-times";
import { type SittingFormType, SittingWeekdaysField } from "./sitting-weekdays-field";

export type SittingFieldsProps = { form: SittingFormType; layouts: readonly LayoutOption[] };

/** Every field of a sitting, in the order staff think about it: when, what, pace, online rules. */
export function SittingFields({ form, layouts }: SittingFieldsProps) {
  const t = useTranslations("tableBooking.sittings");
  return (
    <div className="grid gap-5">
      <TextField form={form} name="name" label={t("name")} required />
      <OptionSelectField
        control={form.control}
        name="layoutId"
        label={t("layout")}
        options={layouts}
      />
      <SittingWeekdaysField form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TimeField form={form} name="firstStart" label={t("firstStart")} required />
        <TimeField form={form} name="lastStart" label={t("lastStart")} required />
        <DateField form={form} name="validFromDate" label={t("validFrom")} clearable />
        <DateField form={form} name="validUntilDate" label={t("validUntil")} clearable />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="slotMinutes" label={t("slotMinutes")} type="number" />
        <TextField
          form={form}
          name="maxCoversPerSlot"
          label={t("maxCoversPerSlot")}
          type="number"
          placeholder={t("noLimit")}
        />
      </div>
      <SittingTurnTimes form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="maxOnlineParty" label={t("maxOnlineParty")} type="number" />
        <TextField form={form} name="minMinutesAhead" label={t("minMinutesAhead")} type="number" />
        <TextField form={form} name="maxDaysAhead" label={t("maxDaysAhead")} type="number" />
        <TextField
          form={form}
          name="changeCutoffMinutes"
          label={t("changeCutoffMinutes")}
          type="number"
        />
        <TextField
          form={form}
          name="depositFromParty"
          label={t("depositFromParty")}
          type="number"
        />
        <TextField form={form} name="depositPerCover" label={t("depositPerCover")} type="number" />
      </div>
    </div>
  );
}
