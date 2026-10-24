import { DEMAND_WINDOWS } from "@bibi/core/schemas";
import { Checkbox, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { DemandFormOutput, DemandFormValues } from "./demand-form-schema";

export type DemandWindowsFieldProps = {
  control: Control<DemandFormValues, unknown, DemandFormOutput>;
};

/** The line windows each unit is held for: setup, booking and teardown. */
export function DemandWindowsField({ control }: DemandWindowsFieldProps) {
  const t = useTranslations("itemDemand");
  return (
    <FormController
      control={control}
      name="windows"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.windows")}</FormLabel>
          <div className="flex flex-wrap gap-4">
            {DEMAND_WINDOWS.map((window) => (
              <FormItem key={window} className="flex flex-row items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value.includes(window)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, window]
                          : field.value.filter((chosen) => chosen !== window),
                      )
                    }
                  />
                </FormControl>
                <FormLabel>{t(`windows.${window}`)}</FormLabel>
              </FormItem>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
