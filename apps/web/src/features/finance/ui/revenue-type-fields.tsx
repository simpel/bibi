import { DEFAULT_ACCOUNTS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { AccountingFormValues, ItemTypeOption } from "../lib/accounting-form";
import { AccountField } from "./account-field";

export type RevenueTypeFieldsProps = {
  control: Control<AccountingFormValues, unknown, unknown>;
  types: ItemTypeOption[];
  /** The default revenue account as it stands now, for the hint. */
  defaultAccount: string;
};

/** One account input per active item type; empty uses the default revenue account. */
export function RevenueTypeFields({ control, types, defaultAccount }: RevenueTypeFieldsProps) {
  const t = useTranslations("finance.accounting");
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">{t("groups.revenueByType")}</h2>
        <p className="text-sm text-muted-foreground">{t("revenueByTypeHint")}</p>
      </div>
      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTypes")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {types.map(({ id, name }, index) => (
            <AccountField
              key={id}
              control={control}
              name={`typeAccounts.${index}.account`}
              label={name}
              hint={t("usesDefault", {
                account: defaultAccount || DEFAULT_ACCOUNTS.revenueAccount,
              })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
