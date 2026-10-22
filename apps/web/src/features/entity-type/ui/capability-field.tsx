import { CAPABILITY_REQUIRES, ITEM_CAPABILITIES, type ItemCapability } from "@bibi/core/schemas";
import { FormController, FormDescription, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { toggleCapability } from "./capability-model";
import { CapabilitySection } from "./capability-section";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type CapabilityFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
  /** Settings shown inside a section while it is switched on, e.g. setup and teardown. */
  settings?: Partial<Record<ItemCapability, React.ReactNode>>;
};

/** One section per item capability with a plain-language switch; switching on pulls in what it needs. */
export function CapabilityField({ control, settings }: CapabilityFieldProps) {
  const t = useTranslations("entityType");
  return (
    <FormController
      control={control}
      name="capabilities"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.sections")}</FormLabel>
          <FormDescription>{t("sectionsHint")}</FormDescription>
          <div className="grid gap-3">
            {ITEM_CAPABILITIES.map((capability) => {
              const required = CAPABILITY_REQUIRES[capability];
              const on = field.value.includes(capability);
              return (
                <CapabilitySection
                  key={capability}
                  capability={capability}
                  checked={on}
                  requires={required ? t(`sections.${required}.title`) : null}
                  onChange={(checked) =>
                    field.onChange(toggleCapability({ current: field.value, capability, checked }))
                  }
                >
                  {on ? settings?.[capability] : null}
                </CapabilitySection>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
