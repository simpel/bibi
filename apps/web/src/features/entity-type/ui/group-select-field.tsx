import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type GroupOption = { id: string; name: string };

export type GroupSelectFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
  groups: readonly GroupOption[];
};

/** Item types: the group the type is browsed under (ADR 0101); left out when there are no groups. */
export function GroupSelectField({ control, groups }: GroupSelectFieldProps) {
  const t = useTranslations("entityType");
  if (groups.length === 0) return null;
  return (
    <OptionSelectField
      control={control}
      name="groupId"
      label={t("fields.group")}
      options={groups}
      noneLabel={t("noGroup")}
    />
  );
}
