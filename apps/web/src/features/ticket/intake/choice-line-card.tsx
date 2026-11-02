import { Form } from "@bibi/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { OptionGroupField } from "../../line/ui/option-group-field";
import { SplitGroupField } from "../../line/ui/split-group-field";
import type { IntakeCatalog } from "./catalog";
import { type ChoiceValues, choiceDefaults, requiredGroups, withChoices } from "./choice-lines";
import type { DraftLine } from "./draft-line";
import { LineNeedsFields } from "./line-needs-fields";

export type ChoiceLineCardProps = {
  line: DraftLine;
  catalog: IntakeCatalog;
  /** The line's effective quantity, what a split group should add up to; null while unknown. */
  quantity: number | null;
  onChange: (input: { line: DraftLine }) => void;
};

/**
 * One package line in the choices step (ADR 0089): its required groups and its needs. Every
 * change goes straight into the draft line; a choice left open is asked again in review.
 */
export function ChoiceLineCard({ line, catalog, quantity, onChange }: ChoiceLineCardProps) {
  const groups = catalog.items.find(({ id }) => id === line.itemId)?.groups ?? [];
  const form = useForm<ChoiceValues>({ defaultValues: choiceDefaults({ line, groups }) });
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      onChange({ line: withChoices({ line, groups, values, needTypeId: catalog.needTypeId }) });
    });
    return () => subscription.unsubscribe();
  }, [form, line, groups, catalog.needTypeId, onChange]);
  const required = new Set(requiredGroups({ groups }));
  return (
    <Form {...form}>
      <fieldset className="grid gap-4 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">{line.name}</legend>
        {groups.map((group, index) => {
          if (!required.has(group)) return null;
          return group.split ? (
            <SplitGroupField key={group.name} {...{ form, index, group, quantity }} />
          ) : (
            <OptionGroupField key={group.name} form={form} index={index} group={group} />
          );
        })}
        {catalog.needTypeId ? <LineNeedsFields form={form} values={catalog.needValues} /> : null}
      </fieldset>
    </Form>
  );
}
