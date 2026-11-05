import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadCustomer } from "@/features/customer/load-customer";
import { customerRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { CustomerUpdateForm } from "./customer-update-form";

export type CustomerUpdateProps = { locale: Locale; id: string };

/** `/customers/[id]/update`: edit the customer on a page of its own. */
export async function CustomerUpdate({ locale, id }: CustomerUpdateProps) {
  const t = await getTranslations("customer");
  const [customer, data] = await Promise.all([
    loadCustomer({ id }),
    loadTypedFormData({ base: "CUSTOMER" }),
  ]);
  if (!customer.ok) {
    return <ErrorState errorKey={handleLoadError({ error: customer.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <>
      <CrumbName href={customerRoute({ id })} name={customer.value.name} />
      <FormPageShell
        backHref={customerRoute({ id })}
        title={t("edit")}
        description={t("editDescription")}
      >
        <CustomerUpdateForm customer={customer.value} data={data.value} />
      </FormPageShell>
    </>
  );
}
