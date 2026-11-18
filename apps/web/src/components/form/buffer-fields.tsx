import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { TextField } from "./text-field";

export type BufferFieldsProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  /**
   * The minutes an empty field inherits, shown as its placeholder. Never written into the
   * field: a value there would be saved as the record's own and stop following the default.
   */
  inherited?: { setupMinutes: number; teardownMinutes: number } | undefined;
};

/**
 * Setup and teardown minutes of a type, item or line (ADR 0059): held around each booking of a
 * bookable item. The form's values must have `setupMinutes` and `teardownMinutes` as strings;
 * empty inherits.
 */
export function BufferFields<V extends FieldValues, O>({
  form,
  inherited,
}: BufferFieldsProps<V, O>) {
  const t = useTranslations("buffers");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold">{t("legend")}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name={"setupMinutes" as Path<V>}
          label={t("setupMinutes")}
          type="number"
          placeholder={inherited ? String(inherited.setupMinutes) : undefined}
        />
        <TextField
          form={form}
          name={"teardownMinutes" as Path<V>}
          label={t("teardownMinutes")}
          type="number"
          placeholder={inherited ? String(inherited.teardownMinutes) : undefined}
        />
      </div>
    </fieldset>
  );
}
