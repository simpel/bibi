import { getCustomer } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { customerRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { CustomerUpdateForm } from "./customer-update-form";

export type CustomerUpdateProps = { locale: Locale; id: string };

/** `/customers/[id]/update`: edit the customer on a page of its own. */
export async function CustomerUpdate({ locale, id }: CustomerUpdateProps) {
  const t = await getTranslations("customer");
  const [customer, data] = await Promise.all([
    runOperation({ operation: getCustomer, input: { id } }),
    loadTypedFormData({ base: "CUSTOMER" }),
  ]);
  if (!customer.ok) {
    return <ErrorState errorKey={handleLoadError({ error: customer.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={customerRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <CustomerUpdateForm customer={customer.value} data={data.value} />
    </FormPageShell>
  );
}
