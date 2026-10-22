import { CAPABILITY_REQUIRES, ITEM_CAPABILITIES, type ItemCapability } from "@bibi/core/schemas";
import {
  Checkbox,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { toggleCapability } from "./capability-model";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type CapabilityFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** One checkbox per item capability; a capability with a requirement shows a hint and pulls it in. */
export function CapabilityField({ control }: CapabilityFieldProps) {
  const t = useTranslations("entityType");
  return (
    <FormController
      control={control}
      name="capabilities"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.capabilities")}</FormLabel>
          <FormDescription>{t("capabilitiesHint")}</FormDescription>
          <div className="grid gap-3">
            {ITEM_CAPABILITIES.map((capability) => (
              <CapabilityRow
                key={capability}
                capability={capability}
                checked={field.value.includes(capability)}
                onChange={(checked) =>
                  field.onChange(toggleCapability({ current: field.value, capability, checked }))
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

type CapabilityRowProps = {
  capability: ItemCapability;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CapabilityRow({ capability, checked, onChange }: CapabilityRowProps) {
  const t = useTranslations("entityType");
  const required = CAPABILITY_REQUIRES[capability];
  const id = `capability-${capability}`;
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
          {t(`capabilities.${capability}`)}
        </label>
        <p className="text-xs text-muted-foreground">
          {t(`capabilityHints.${capability}`)}
          {required ? ` ${t("requires", { capability: t(`capabilities.${required}`) })}` : ""}
        </p>
      </div>
    </div>
  );
}
