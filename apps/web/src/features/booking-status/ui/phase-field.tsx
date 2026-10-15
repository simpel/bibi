import type { BookingStatusCreateInput } from "@okazi/core/schemas";
import { BOOKING_PHASES } from "@okazi/core/schemas";
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
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { BookingStatusFormValues } from "./booking-status-form-schema";

export type PhaseFieldProps = {
  control: Control<BookingStatusFormValues, unknown, BookingStatusCreateInput>;
  /** Edit mode: the phase is fixed once the status exists. */
  disabled?: boolean;
};

/** The fixed phase a status belongs to (ADR 0022). */
export function PhaseField({ control, disabled = false }: PhaseFieldProps) {
  const t = useTranslations("bookingStatus");
  return (
    <FormController
      control={control}
      name="phase"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.phase")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {BOOKING_PHASES.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {t(`phases.${phase}`)}
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
