import type { TicketPhaseDto } from "@bibi/core/schemas";
import {
  Checkbox,
  ColorSwatch,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { TransitionsFormOutput, TransitionsFormValues } from "./transitions-form-schema";

export type TransitionTargetsFieldProps = {
  control: Control<TransitionsFormValues, unknown, TransitionsFormOutput>;
  targets: readonly TicketPhaseDto[];
};

type ToggleInput = { ids: readonly string[]; id: string; on: boolean };

const toggle = ({ ids, id, on }: ToggleInput) =>
  on ? [...ids, id] : ids.filter((candidate) => candidate !== id);

/** One checkbox per other phase: may a ticket move there? */
export function TransitionTargetsField({ control, targets }: TransitionTargetsFieldProps) {
  const t = useTranslations("ticketPhase");
  return (
    <FormController
      control={control}
      name="toPhaseIds"
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
              </Label>
            </div>
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
