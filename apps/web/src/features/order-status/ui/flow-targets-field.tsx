import type { OrderStatusDto } from "@bibi/core/schemas";
import { Checkbox, ColorSwatch, FormControl, FormController, FormItem, FormLabel } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { FlowMovesOutput, FlowMovesValues } from "./flow-moves-form-schema";

export type FlowTargetsFieldProps = {
  control: Control<FlowMovesValues, unknown, FlowMovesOutput>;
  name: string;
  targets: readonly OrderStatusDto[];
};

type ToggleInput = { ids: readonly string[]; id: string; on: boolean };

const toggle = ({ ids, id, on }: ToggleInput) =>
  on ? [...ids, id] : ids.filter((candidate) => candidate !== id);

/** The statuses an order may move to, one sentence-labelled checkbox each. */
export function FlowTargetsField({ control, name, targets }: FlowTargetsFieldProps) {
  const t = useTranslations("orderStatus.flow");
  return (
    <FormController
      control={control}
      name="toStatusIds"
      render={({ field }) => (
        <fieldset className="grid gap-2 ps-6">
          <legend className="sr-only">{t("onlyTheseLegend", { name })}</legend>
          {targets.map((target) => (
            <FormItem key={target.id} className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value.includes(target.id)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      toggle({ ids: field.value, id: target.id, on: checked === true }),
                    )
                  }
                />
              </FormControl>
              <FormLabel className="inline-flex items-center gap-2">
                <ColorSwatch color={target.color} />
                {t("canMoveTo", { name, target: target.name })}
              </FormLabel>
            </FormItem>
          ))}
        </fieldset>
      )}
    />
  );
}
