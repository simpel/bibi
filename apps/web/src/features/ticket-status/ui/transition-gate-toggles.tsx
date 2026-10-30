import { TRANSITION_GATES, type TransitionGate } from "@bibi/core/schemas";
import { Checkbox, FormController, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { TransitionsFormOutput, TransitionsFormValues } from "./transitions-form-schema";

export type TransitionGateTogglesProps = {
  control: Control<TransitionsFormValues, unknown, TransitionsFormOutput>;
  toStatusId: string;
};

type ToggleInput = { keys: readonly TransitionGate[]; key: TransitionGate; on: boolean };

const toggle = ({ keys, key, on }: ToggleInput) =>
  on ? [...keys, key] : keys.filter((candidate) => candidate !== key);

/** The gates of one allowed move (ADR 0067 §5): what a ticket needs to make it. */
export function TransitionGateToggles({ control, toStatusId }: TransitionGateTogglesProps) {
  const t = useTranslations("ticketStatus.gates");
  return (
    <FormController
      control={control}
      name="gates"
      render={({ field }) => {
        const keys = field.value[toStatusId] ?? [];
        return (
          <fieldset className="flex flex-wrap gap-x-4 gap-y-1 ps-6" aria-label={t("label")}>
            {TRANSITION_GATES.map((key) => {
              const id = `gate-${toStatusId}-${key}`;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    id={id}
                    checked={keys.includes(key)}
                    onCheckedChange={(checked) =>
                      field.onChange({
                        ...field.value,
                        [toStatusId]: toggle({ keys, key, on: checked === true }),
                      })
                    }
                  />
                  <Label htmlFor={id} className="text-xs text-muted-foreground">
                    {t(key)}
                  </Label>
                </div>
              );
            })}
          </fieldset>
        );
      }}
    />
  );
}
