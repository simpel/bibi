import { DEFAULT_ACCOUNTS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { AccountingFormValues, AccountKey } from "../lib/accounting-form";
import { AccountField } from "./account-field";

export type AccountGroupProps = {
  control: Control<AccountingFormValues, unknown, unknown>;
  title: string;
  keys: readonly AccountKey[];
};

/** One titled group of fixed accounts, each with its BAS default as the hint. */
export function AccountGroup({ control, title, keys }: AccountGroupProps) {
  const t = useTranslations("finance.accounting");
  return (
    <section className="grid gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <AccountField
            key={key}
            control={control}
            name={key}
            label={t(`fields.${key}`)}
            hint={t("default", { account: DEFAULT_ACCOUNTS[key] })}
          />
        ))}
      </div>
    </section>
  );
}
