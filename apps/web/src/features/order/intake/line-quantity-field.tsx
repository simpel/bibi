import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import type { LineDialogFormApi } from "./use-line-dialog-form";

export type LineQuantityFieldProps = { form: LineDialogFormApi; headcount: number };

/**
 * Quantity: empty follows the guest count (shown as the placeholder); a number fixes it, and
 * "Use the guest count" returns to following (spec "The line dialog").
 */
export function LineQuantityField({ form, headcount }: LineQuantityFieldProps) {
  const t = useTranslations("orderIntake.line");
  const fixed = form.watch("quantity").trim() !== "";
  return (
    <div className="grid gap-1.5">
      <TextField
        form={form}
        name="quantity"
        label={t("quantity")}
        type="number"
        step="1"
        placeholder={String(headcount)}
      />
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{fixed ? t("fixedAt", { quantity: form.watch("quantity") }) : t("perGuest")}</span>
        {fixed ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => form.setValue("quantity", "", { shouldDirty: true })}
          >
            {t("useGuests", { guests: headcount })}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
