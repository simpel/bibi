import type { BookingStatusDto } from "@okazi/core/schemas";
import {
  Checkbox,
  ColorSwatch,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { TransitionsFormOutput, TransitionsFormValues } from "./transitions-form-schema";

export type TransitionTargetsFieldProps = {
  control: Control<TransitionsFormValues, unknown, TransitionsFormOutput>;
  targets: readonly BookingStatusDto[];
};

type ToggleInput = { ids: readonly string[]; id: string; on: boolean };

const toggle = ({ ids, id, on }: ToggleInput) =>
  on ? [...ids, id] : ids.filter((candidate) => candidate !== id);

/** One checkbox per other status: may a booking move there? */
export function TransitionTargetsField({ control, targets }: TransitionTargetsFieldProps) {
  const t = useTranslations("bookingStatus");
  return (
    <FormController
      control={control}
      name="toStatusIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.transitions")}</FormLabel>
          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTargets")}</p>
          ) : null}
          {targets.map((target) => (
            <div key={target.id} className="flex items-center gap-2 text-sm">
              <FormControl>
                <Checkbox
                  id={`transition-${target.id}`}
                  checked={field.value.includes(target.id)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      toggle({ ids: field.value, id: target.id, on: checked === true }),
                    )
                  }
                />
              </FormControl>
              <Label htmlFor={`transition-${target.id}`} className="inline-flex items-center gap-2">
                <ColorSwatch color={target.color} />
                {target.name}
                <span className="text-muted-foreground">{t(`phases.${target.phase}`)}</span>
              </Label>
            </div>
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
