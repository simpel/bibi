import { DEFAULT_ACCOUNTS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { type AccountTarget, targetField } from "../lib/account-rows";
import type { AccountingFormValues, ItemTypeOption } from "../lib/accounting-form";
import { AccountField } from "./account-field";

export type AccountTargetFieldProps = {
  control: Control<AccountingFormValues, unknown, unknown>;
  target: AccountTarget;
  types: ItemTypeOption[];
  /** The default revenue account as it stands now, for the item type hint. */
  defaultAccount: string;
};

/** The one input of a row: an account number. */
export function AccountTargetField({
  control,
  target,
  types,
  defaultAccount,
}: AccountTargetFieldProps) {
  const t = useTranslations("finance.accounting");
  const name = targetField({ target, types });
  if (target.kind === "type") {
    const entityTypeId = target.entityTypeId;
    const label = types.find(({ id }) => id === entityTypeId)?.name ?? "";
    const account = defaultAccount || DEFAULT_ACCOUNTS.revenueAccount;
    return (
      <AccountField
        control={control}
        name={name}
        label={label}
        hint={t("usesDefault", { account })}
      />
    );
  }
  return (
    <AccountField
      control={control}
      name={name}
      label={t(`fields.${target.key}`)}
      hint={t("default", { account: DEFAULT_ACCOUNTS[target.key] })}
    />
  );
}
