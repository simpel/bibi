import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ExtraAddOn } from "./choose-options-extras";
import type { ChosenOption } from "./choose-options-schema";
import { OptionGroupField } from "./option-group-field";
import type { CustomisableItem } from "./program-form-data";
import { SplitGroupField } from "./split-group-field";
import { allowsExtras } from "./split-picks";
import { useChooseOptionsForm } from "./use-choose-options-form";

export type ChooseOptionsFormProps = {
  lineId: string;
  ticketId: string;
  /** The line's add-ons that are extra picks of its groups (ADR 0088). */
  extras: readonly ExtraAddOn[];
  item: CustomisableItem;
  chosen: readonly ChosenOption[];
  /** The line's effective quantity, which a split group's quantities should add up to. */
  quantity: number | null;
  onDone: () => void;
};

/**
 * One choice list per customisation group of the line's item: `line.chooseOptions` (ADR 0059), a
 * quantity per option in a split group (ADR 0082). Picks beyond the max of a group that allows
 * extras are added as add-ons at the item's own price (ADR 0088).
 */
export function ChooseOptionsForm(props: ChooseOptionsFormProps) {
  const { item, quantity, onDone } = props;
  const t = useTranslations("line");
  const common = useTranslations("common");
  const { form, submit, pending } = useChooseOptionsForm(props);
  const extras = item.groups.some((group) => allowsExtras({ group }));
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
        {extras ? <p className="text-sm text-muted-foreground">{t("extrasHint")}</p> : null}
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
