"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { updateAccountingSettingsAction } from "../actions";
import { ACCOUNT_GROUPS, type ItemTypeOption } from "../lib/accounting-form";
import { AccountGroup } from "./account-group";
import { AccountingFormFooter } from "./accounting-form-footer";
import { FiscalYearSection } from "./fiscal-year-section";
import { RevenueTypeFields } from "./revenue-type-fields";
import { useAccountingForm } from "./use-accounting-form";

export type AccountingFormProps = {
  settings: AccountingSettingsDto;
  types: ItemTypeOption[];
  /** Without `finance:write` every input is disabled and there is no save button. */
  canEdit: boolean;
};

/** `/settings/accounting`: accounts, output VAT, fiscal year and revenue per item type (ADR 0077). */
export function AccountingForm({ settings, types, canEdit }: AccountingFormProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useAccountingForm({ settings, types });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateAccountingSettingsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-8">
        <fieldset disabled={!canEdit} className="grid gap-8">
          <AccountGroup
            control={form.control}
            title={t("groups.accounts")}
            keys={ACCOUNT_GROUPS.accounts}
          />
          <AccountGroup control={form.control} title={t("groups.vat")} keys={ACCOUNT_GROUPS.vat} />
          <FiscalYearSection control={form.control} />
          <RevenueTypeFields
            control={form.control}
            types={types}
            defaultAccount={settings.revenueAccount}
          />
        </fieldset>
        <AccountingFormFooter canEdit={canEdit} pending={pending} />
      </form>
    </Form>
  );
}
