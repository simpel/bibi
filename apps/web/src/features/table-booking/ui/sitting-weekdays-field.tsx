import { Button, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { SittingFormOutput, SittingFormValues } from "../lib/sitting-form";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type SittingFormType = UseFormReturn<SittingFormValues, unknown, SittingFormOutput>;

/** Seven toggle buttons, Monday first: the weekdays the sitting takes bookings. */
export function SittingWeekdaysField({ form }: { form: SittingFormType }) {
  const t = useTranslations("tableBooking");
  return (
    <FormController
      control={form.control}
      name="weekdays"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("sittings.weekdays")}</FormLabel>
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">{t("sittings.weekdays")}</legend>
            {WEEKDAYS.map((day) => {
              const on = field.value.includes(day);
              return (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={on ? "default" : "outline"}
                  aria-pressed={on}
                  onClick={() =>
                    field.onChange(
                      on ? field.value.filter((d) => d !== day) : [...field.value, day],
                    )
                  }
                >
                  {t(`weekdays.${day}`)}
                </Button>
              );
            })}
          </fieldset>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
