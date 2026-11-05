import type { OrderTemplateCreateInput } from "@bibi/core/schemas";
import { FormController, FormItem, FormLabel, FormMessage, MultiChoiceControl } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useWatch } from "react-hook-form";
import type { OrderTemplateFormData } from "./order-template-form-data";
import type { OrderTemplateFormValues } from "./order-template-form-schema";

type Form = UseFormReturn<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>;

type Group = OrderTemplateFormData["customisable"][number]["groups"][number];

type GroupProps = {
  id: string;
  group: Group;
  value: string[];
  onChange: (value: string[]) => void;
};

/** One normal group's options; a pick beyond its maxPick replaces the oldest. */
function GroupChoices({ id, group, value, onChange }: GroupProps) {
  const t = useTranslations("orderTemplate");
  const own = group.options.map((option) => option.itemId);
  const picked = value.filter((itemId) => own.includes(itemId));
  const choices = group.options.map(({ itemId, name }) => ({ value: itemId, label: name }));
  const others = value.filter((itemId) => !own.includes(itemId));
  return (
    <FormItem>
      <FormLabel>{t("defaultGroup", { name: group.name, max: group.maxPick })}</FormLabel>
      <MultiChoiceControl
        id={id}
        value={picked}
        choices={choices}
        onChange={(next) => onChange([...others, ...next.slice(-group.maxPick)])}
      />
    </FormItem>
  );
}

type LineGroupProps = {
  group: Group;
  index: number;
  value: string[];
  onChange: (value: string[]) => void;
};

/** A normal group's defaults, or the note that a split group is asked at intake. */
function LineGroup({ group, index, value, onChange }: LineGroupProps) {
  const t = useTranslations("orderTemplate");
  if (group.split) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("splitAskedAtIntake", { name: group.name })}
      </p>
    );
  }
  const id = `line-${index}-${group.name}`;
  return <GroupChoices {...{ id, group, value, onChange }} />;
}

export type TemplateLineChoicesProps = {
  form: Form;
  data: OrderTemplateFormData;
  index: number;
};

/**
 * The choices the package preselects for its line (ADR 0089), one control per normal group of
 * the line's item; a split group is always asked at intake. Defaults that no longer fit were
 * dropped from the form and are named here, so saving removes them.
 */
export function TemplateLineChoices({ form, data, index }: TemplateLineChoicesProps) {
  const t = useTranslations("orderTemplate");
  const itemId = useWatch({ control: form.control, name: `lines.${index}.itemId` });
  const stale = useWatch({ control: form.control, name: `lines.${index}.staleOptions` }) ?? [];
  const groups = data.customisable.find((item) => item.itemId === itemId)?.groups ?? [];
  const names = new Map(data.items.map(({ id, name }) => [id, name]));
  if (groups.length === 0 && stale.length === 0) return null;
  const staleText = stale.map((id) => t("staleDefault", { name: names.get(id) ?? "–" }));
  return (
    <div className="grid gap-4">
      {staleText.map((text) => (
        <p key={text} className="text-sm text-warning-foreground">
          {text}
        </p>
      ))}
      <FormController
        control={form.control}
        name={`lines.${index}.options`}
        render={({ field }) => (
          <div className="grid gap-4">
            {groups.map((group) => (
              <LineGroup key={group.name} {...{ group, index }} {...field} />
            ))}
            <FormMessage />
          </div>
        )}
      />
    </div>
  );
}
