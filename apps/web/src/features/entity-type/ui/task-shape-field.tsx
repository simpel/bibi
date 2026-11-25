import { TASK_SHAPES } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type TaskShapeFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** Task types: a meeting (start and end) or a deadline (one due time), required (ADR 0117). */
export function TaskShapeField({ control }: TaskShapeFieldProps) {
  const t = useTranslations("entityType");
  const shapes = useTranslations("task.shapes");
  const options = TASK_SHAPES.map((shape) => ({ id: shape, name: shapes(shape) }));
  return (
    <OptionSelectField
      control={control}
      name="taskShape"
      label={t("fields.taskShape")}
      options={options}
    />
  );
}
