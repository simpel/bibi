import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Path, UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ChooseOptionsFormValues } from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";

export type SplitGroupFieldProps<V extends ChooseOptionsFormValues, O> = {
  /** Any form whose values carry `groups` as the options form does (also the intake's line). */
  form: UseFormReturn<V, unknown, O>;
  index: number;
  group: CustomisableItem["groups"][number];
  /** The line's effective quantity the split should add up to; null while unknown. */
  quantity: number | null;
};

type RuleMessageProps<V extends ChooseOptionsFormValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  index: number;
};

/** The group's broken pick rule ("Choose 1–2"), set on `groups.<n>.quantities` as a whole. */
function GroupRuleMessage<V extends ChooseOptionsFormValues, O>({
  form,
  index,
}: RuleMessageProps<V, O>) {
  const name = `groups.${index}.quantities` as Path<V>;
  const message = form.getFieldState(name, form.formState).error?.message;
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

type SplitSumProps<V extends ChooseOptionsFormValues, O> = RuleMessageProps<V, O> & {
  quantity: number | null;
};

/**
 * How many the split places against the line's quantity, while typing: amber when it places more
 * than there are (core keeps it and warns OPTION_SPLIT_MISMATCH), a count while it places fewer.
 */
function SplitSum<V extends ChooseOptionsFormValues, O>({
  form,
  index,
  quantity,
}: SplitSumProps<V, O>) {
  const t = useTranslations("line");
  const values = form.watch(`groups.${index}.quantities` as Path<V>) as Record<string, string>;
  const sum = Object.values(values ?? {}).reduce((total, raw) => {
    const value = Number(raw.trim() === "" ? 0 : raw);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
  if (quantity === null || sum === 0 || sum === quantity) return null;
  if (sum < quantity)
    return (
      <p className="text-sm text-muted-foreground">{t("splitSum.under", { sum, quantity })}</p>
    );
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0 text-warning" />
      {t("splitSum.over", { sum, quantity })}
    </p>
  );
}

/** A split group (ADR 0082): a quantity per option, 0 = not chosen, and the running sum. */
export function SplitGroupField<V extends ChooseOptionsFormValues, O>({
  form,
  index,
  group,
  quantity,
}: SplitGroupFieldProps<V, O>) {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const { name, minPick: min, maxPick: max } = group;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">
        {t("optionGroup", { name, min, max, same: String(min === max) })}
      </legend>
      {quantity === null ? null : (
        <p className="text-sm text-muted-foreground">{t("optionSplitHint", { quantity })}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {group.options.map((option) => (
          <TextField
            key={option.itemId}
            form={form}
            name={`groups.${index}.quantities.${option.itemId}` as Path<V>}
            label={t("optionChoice", { name: option.name, effect: effects(option.priceEffect) })}
            type="number"
            step="1"
          />
        ))}
      </div>
      <SplitSum form={form} index={index} quantity={quantity} />
      <GroupRuleMessage form={form} index={index} />
    </fieldset>
  );
}
