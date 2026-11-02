import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ChosenOption } from "./choose-options-schema";
import { OptionGroupField } from "./option-group-field";
import type { CustomisableItem } from "./program-form-data";
import { SplitGroupField } from "./split-group-field";
import { useChooseOptionsForm } from "./use-choose-options-form";

export type ChooseOptionsFormProps = {
  lineId: string;
  item: CustomisableItem;
  chosen: readonly ChosenOption[];
  /** The line's effective quantity, which a split group's quantities should add up to. */
  quantity: number | null;
  onDone: () => void;
};

/**
 * One choice list per customisation group of the line's item: `line.chooseOptions` (ADR 0059), a
 * quantity per option in a split group (ADR 0082).
 */
export function ChooseOptionsForm(props: ChooseOptionsFormProps) {
  const { lineId, item, chosen, quantity, onDone } = props;
  const common = useTranslations("common");
  const { form, submit, pending } = useChooseOptionsForm({ lineId, item, chosen, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {item.groups.map((group, index) =>
          group.split ? (
            <SplitGroupField key={group.name} {...{ form, index, group, quantity }} />
          ) : (
            <OptionGroupField key={group.name} form={form} index={index} group={group} />
          ),
        )}
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
