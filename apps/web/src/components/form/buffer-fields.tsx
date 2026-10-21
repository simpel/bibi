import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { TextField } from "./text-field";

/** Where an empty field inherits from; null = nothing (no buffer). */
export type BufferInherits = "type" | "item" | null;

export type BufferFieldsProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  inherits: BufferInherits;
  /** The minutes in effect when the fields are empty, shown as a hint. */
  inherited?: { setupMinutes: number; teardownMinutes: number } | undefined;
};

/**
 * Setup and teardown minutes of a type, item or line (ADR 0059): held around each booking of a
 * bookable item. The form's values must have `setupMinutes` and `teardownMinutes` as strings.
 */
export function BufferFields<V extends FieldValues, O>({
  form,
  inherits,
  inherited,
}: BufferFieldsProps<V, O>) {
  const t = useTranslations("buffers");
  const hint = inherits ? t(`inherits.${inherits}`) : t("inherits.none");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold">{t("legend")}</legend>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name={"setupMinutes" as Path<V>}
          label={t("setupMinutes")}
          type="number"
        />
        <TextField
          form={form}
          name={"teardownMinutes" as Path<V>}
          label={t("teardownMinutes")}
          type="number"
        />
      </div>
      {inherited ? (
        <p className="text-sm text-muted-foreground">
          {t("inEffect", { setup: inherited.setupMinutes, teardown: inherited.teardownMinutes })}
        </p>
      ) : null}
    </fieldset>
  );
}
