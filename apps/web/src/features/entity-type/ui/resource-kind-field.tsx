import { RESOURCE_KINDS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type ResourceKindFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** Item types: Equipment or Person, which decides Resources or Staffing (ADR 0059). */
export function ResourceKindField({ control }: ResourceKindFieldProps) {
  const t = useTranslations("entityType");
  const options = RESOURCE_KINDS.map((kind) => ({ id: kind, name: t(`resourceKinds.${kind}`) }));
  return (
    <OptionSelectField
      control={control}
      name="resourceKind"
      label={t("fields.resourceKind")}
      options={options}
    />
  );
}
