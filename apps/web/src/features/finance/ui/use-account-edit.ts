import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { updateAccountingSettingsAction } from "../actions";
import { type AccountTarget, targetField } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { type UseAccountingFormInput, useAccountingForm } from "./use-accounting-form";

export type UseAccountEditInput = UseAccountingFormInput & {
  /** The row being edited; absent = add, where an item type is picked first. */
  target?: AccountTarget | undefined;
  onDone: () => void;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: AccountingSettingsDto }) => void) | undefined;
};

/** The accounting form for one row (or a new item type account) and its save action. */
export function useAccountEdit({ settings, types, target, onDone, onSaved }: UseAccountEditInput) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const router = useRouter();
  const [picked, setPicked] = useState("");
  const current: AccountTarget | undefined =
    target ?? (picked ? { kind: "type", entityTypeId: picked } : undefined);
  const form = useAccountingForm({ settings, types });
  const value = current ? form.watch(targetField({ target: current, types })) : "";
  const field = current ? targetField({ target: current, types }) : null;
  const label = current ? targetLabel({ target: current, types, fieldLabel: t }) : "";
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateAccountingSettingsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: ({ value }) => {
      if (onSaved) onSaved({ value });
      else router.refresh();
      onDone();
    },
    confirm: () => (field ? [{ field: label, value: String(form.getValues(field) ?? "") }] : []),
  });
  const blocked = pending || (!target && String(value).trim() === "");
  return { form, submit, blocked, current, picked, setPicked };
}

type TargetLabelInput = {
  target: AccountTarget;
  types: ItemTypeOption[];
  fieldLabel: (key: `fields.${Extract<AccountTarget, { kind: "account" }>["key"]}`) => string;
};

/** The row's name as the table shows it: the account's label, or the item type's name. */
function targetLabel({ target, types, fieldLabel }: TargetLabelInput): string {
  if (target.kind === "account") return fieldLabel(`fields.${target.key}`);
  const entityTypeId = target.entityTypeId;
  return types.find(({ id }) => id === entityTypeId)?.name ?? "";
}
