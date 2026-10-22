import { MANUAL_OCCUPANCY_TYPES } from "@bibi/core/schemas";
import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { OccupancyFormOutput, OccupancyFormValues } from "./occupancy-form-schema";

export type OccupancyTypeFieldProps = {
  control: Control<OccupancyFormValues, unknown, OccupancyFormOutput>;
};

/** Why the item is blocked: maintenance or internal use. */
export function OccupancyTypeField({ control }: OccupancyTypeFieldProps) {
  const t = useTranslations("occupancy");
  return (
    <FormController
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.type")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {MANUAL_OCCUPANCY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
