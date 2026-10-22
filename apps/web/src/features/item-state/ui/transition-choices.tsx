import type { ItemStateDto } from "@bibi/core/schemas";
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

export type TransitionValues = { toStateIds: string[] };

export type TransitionChoicesProps = {
  // biome-ignore lint/suspicious/noExplicitAny: the output type is the operation input, unused here
  control: Control<TransitionValues, unknown, any>;
  choices: readonly ItemStateDto[];
};

type ToggleInput = { ids: readonly string[]; id: string; on: boolean };

const toggle = ({ ids, id, on }: ToggleInput) =>
  on ? [...ids, id] : ids.filter((candidate) => candidate !== id);

/** One checkbox per other state of the type: may a line move there? */
export function TransitionChoices({ control, choices }: TransitionChoicesProps) {
  const t = useTranslations("itemState");
  return (
    <FormController
      control={control}
      name="toStateIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.transitions")}</FormLabel>
          {choices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTargets")}</p>
          ) : null}
          {choices.map((target) => (
            <div key={target.id} className="flex items-center gap-2 text-sm">
              <FormControl>
                <Checkbox
                  id={`transition-${target.id}`}
                  checked={field.value.includes(target.id)}
                  onCheckedChange={(on) =>
                    field.onChange(toggle({ ids: field.value, id: target.id, on: on === true }))
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
