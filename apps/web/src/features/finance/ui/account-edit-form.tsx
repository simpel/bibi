import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { AccountTarget } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountTargetField } from "./account-target-field";
import { TypePicker } from "./type-picker";
import { useAccountEdit } from "./use-account-edit";

export type AccountEditFormProps = {
  settings: AccountingSettingsDto;
  /** Every active item type, in the order of the form's type accounts. */
  types: ItemTypeOption[];
  /** The row being edited; absent = add, picking one of `choices` first. */
  target?: AccountTarget | undefined;
  choices?: ItemTypeOption[] | undefined;
  onDone: () => void;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: AccountingSettingsDto }) => void) | undefined;
};

/** One input over the full accounting update: the rest of the settings are sent as they are. */
export function AccountEditForm({ settings, types, choices, ...rest }: AccountEditFormProps) {
  const common = useTranslations("common");
  const { form, submit, blocked, current, picked, setPicked } = useAccountEdit({
    settings,
    types,
    ...rest,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {choices ? <TypePicker choices={choices} value={picked} onChange={setPicked} /> : null}
        {current ? (
          <AccountTargetField
            control={form.control}
            target={current}
            types={types}
            defaultAccount={settings.revenueAccount}
          />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={rest.onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={blocked}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
