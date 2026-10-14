import { BEHAVIOUR_REQUIRES, ITEM_BEHAVIOURS, type ItemBehaviour } from "@okazi/core/schemas";
import {
  Checkbox,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { toggleBehaviour } from "./behaviour-model";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type BehaviourFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** One checkbox per item behaviour; a behaviour with a requirement shows a hint and pulls it in. */
export function BehaviourField({ control }: BehaviourFieldProps) {
  const t = useTranslations("entityType");
  return (
    <FormController
      control={control}
      name="behaviours"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.behaviours")}</FormLabel>
          <FormDescription>{t("behavioursHint")}</FormDescription>
          <div className="grid gap-3">
            {ITEM_BEHAVIOURS.map((behaviour) => (
              <BehaviourRow
                key={behaviour}
                behaviour={behaviour}
                checked={field.value.includes(behaviour)}
                onChange={(checked) =>
                  field.onChange(toggleBehaviour({ current: field.value, behaviour, checked }))
                }
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type BehaviourRowProps = {
  behaviour: ItemBehaviour;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function BehaviourRow({ behaviour, checked, onChange }: BehaviourRowProps) {
  const t = useTranslations("entityType");
  const required = BEHAVIOUR_REQUIRES[behaviour];
  const id = `behaviour-${behaviour}`;
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className="mt-0.5"
      />
      <div className="grid gap-0.5">
        <label htmlFor={id} className="text-sm font-medium leading-none">
          {t(`behaviours.${behaviour}`)}
        </label>
        <p className="text-xs text-muted-foreground">
          {t(`behaviourHints.${behaviour}`)}
          {required ? ` ${t("requires", { behaviour: t(`behaviours.${required}`) })}` : ""}
        </p>
      </div>
    </div>
  );
}
