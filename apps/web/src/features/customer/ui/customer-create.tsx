import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { CustomerWizard } from "./customer-wizard";

export type CustomerCreateProps = { locale: Locale };

/** `/new/customer`: the step-by-step create page. */
export async function CustomerCreate({ locale }: CustomerCreateProps) {
  const t = await getTranslations("customer");
  const data = await loadTypedFormData({ base: "CUSTOMER" });
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.customers}
      title={t("create")}
      description={t("createDescription")}
    >
      <CustomerWizard data={data.value} />
    </FormPageShell>
  );
}
