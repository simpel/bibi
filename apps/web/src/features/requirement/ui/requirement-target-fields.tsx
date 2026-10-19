import type { EntityTypeDto } from "@okazi/core";
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

/** On create only: the type, where the count applies and which list value it counts. */
export function RequirementTargetFields({ form, data, typeOf }: RequirementTargetFieldsProps) {
  const t = useTranslations("requirement");
  return (
    <>
      <TypeSelectField
        control={form.control}
        types={data.types}
        label={t("fields.type")}
        onTypeChange={(id) =>
          form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
        }
      />
      <OptionSelectField
        control={form.control}
        name="lineId"
        label={t("fields.line")}
        options={data.lines}
        noneLabel={t("wholeTicket")}
      />
      <OptionSelectField
        control={form.control}
        name="vocabularyValueId"
        label={t("fields.value")}
        options={data.values}
      />
    </>
  );
}
