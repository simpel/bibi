import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type BuyerKindFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** Customer types: business or private, which a new customer of the type takes (ADR 0106). */
export function BuyerKindField({ control }: BuyerKindFieldProps) {
  const t = useTranslations("entityType");
  const kinds = useTranslations("customer.buyerKind");
  const options = [
    { id: "BUSINESS", name: kinds("BUSINESS") },
    { id: "PRIVATE", name: kinds("PRIVATE") },
  ];
  return (
    <OptionSelectField
      control={control}
      name="buyerKind"
      label={t("fields.buyerKind")}
      options={options}
    />
  );
}
