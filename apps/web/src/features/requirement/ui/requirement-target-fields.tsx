import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import type { RequirementFormData } from "./requirement-form-data";
import type { RequirementFormOutput } from "./requirement-form-schema";
import type { RequirementFormValues } from "./requirement-form-values";

export type RequirementTargetFieldsProps = {
  form: UseFormReturn<RequirementFormValues, unknown, RequirementFormOutput>;
  data: RequirementFormData;
  typeOf: ({ id }: { id: string }) => EntityTypeDto | undefined;
};

/**
 * On create only: the list, then a value from that list alone (each left out when there is just
 * one), where the count applies, and the type when there is more than one.
 */
export function RequirementTargetFields({ form, data, typeOf }: RequirementTargetFieldsProps) {
  const t = useTranslations("requirement");
  const list = data.lists.find(({ id }) => id === form.watch("vocabularyId"));
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="vocabularyId"
        label={t("fields.list")}
        options={data.lists}
        onChange={() => form.setValue("vocabularyValueId", "")}
      />
      {list ? (
        <OptionSelectField
          key={list.id}
          control={form.control}
          name="vocabularyValueId"
          label={list.name}
          options={list.values}
        />
      ) : null}
      <OptionSelectField
        control={form.control}
        name="lineId"
        label={t("fields.line")}
        options={data.lines}
        noneLabel={t("wholeOrder")}
      />
      <TypeSelectField
        control={form.control}
        types={data.types.filter((type) => type.status === "ACTIVE")}
        label={t("fields.type")}
        onTypeChange={(id) =>
          form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
        }
      />
    </>
  );
}
