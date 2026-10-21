import type { LineChooseOptionsInput } from "@okazi/core/schemas";
import {
  Button,
  DialogFooter,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  MultiChoiceControl,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { ChooseOptionsFormValues } from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";
import { useChooseOptionsForm } from "./use-choose-options-form";

type GroupFieldProps = {
  form: UseFormReturn<ChooseOptionsFormValues, unknown, LineChooseOptionsInput>;
  index: number;
  group: CustomisableItem["groups"][number];
};

/** The options of one group as checkboxes, each labelled with its price effect. */
function GroupField({ form, index, group }: GroupFieldProps) {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const choices = group.options.map(({ itemId, name, priceEffect }) => ({
    value: itemId,
    label: t("optionChoice", { name, effect: effects(priceEffect) }),
  }));
  const { name, minPick: min, maxPick: max } = group;
  return (
    <FormController
      control={form.control}
      name={`groups.${index}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("optionGroup", { name, min, max, same: String(min === max) })}</FormLabel>
          <FormControl>
            <MultiChoiceControl value={field.value} onChange={field.onChange} choices={choices} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type ChooseOptionsFormProps = {
  lineId: string;
  item: CustomisableItem;
  chosen: readonly string[];
  onDone: () => void;
};

/** One choice list per customisation group of the line's item: `line.chooseOptions` (ADR 0059). */
export function ChooseOptionsForm({ lineId, item, chosen, onDone }: ChooseOptionsFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending } = useChooseOptionsForm({ lineId, item, chosen, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {item.groups.map((group, index) => (
          <GroupField key={group.name} form={form} index={index} group={group} />
        ))}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
