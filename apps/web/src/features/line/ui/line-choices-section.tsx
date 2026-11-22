import type { LineChooseOptionsInput } from "@bibi/core/schemas";
import { Form, MissingField } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { type ChooseOptionsFormValues, groupOptions } from "./choose-options-schema";
import { OptionGroupField } from "./option-group-field";
import type { CustomisableItem } from "./program-form-data";
import { SplitGroupField } from "./split-group-field";

export type LineChoicesSectionProps = {
  form: UseFormReturn<ChooseOptionsFormValues, unknown, LineChooseOptionsInput>;
  item: CustomisableItem;
  quantity: number | null;
};

/**
 * The line's customisation groups in its edit form, one field per group (ADR 0059, 0082). A
 * required group with nothing chosen is framed in the program's amber "missing" stripes. Its own
 * form state (and context, so each group shows its message), saved with the line.
 */
export function LineChoicesSection({ form, item, quantity }: LineChoicesSectionProps) {
  const t = useTranslations("line");
  const values = form.watch("groups");
  return (
    <Form {...form}>
      <section className="grid gap-3 border-t pt-4">
        <h3 className="text-sm font-medium">{t("choices.title")}</h3>
        {item.groups.map((group, index) => {
          const value = values[index] ?? { picked: [], quantities: {} };
          const open = group.minPick > 0 && groupOptions({ group, value }).length === 0;
          return (
            <MissingField
              key={group.id}
              hint={open ? t("missing.pickHint", { group: group.name }) : undefined}
            >
              {group.split ? (
                <SplitGroupField {...{ form, index, group, quantity }} />
              ) : (
                <OptionGroupField form={form} index={index} group={group} />
              )}
            </MissingField>
          );
        })}
        <p className="text-sm text-muted-foreground">{t("choices.moreHint")}</p>
      </section>
    </Form>
  );
}
