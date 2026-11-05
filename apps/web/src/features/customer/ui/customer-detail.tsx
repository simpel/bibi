import type { Locale } from "@bibi/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { DeferredSection } from "@/components/states/deferred-section";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { customerRoute, ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { ContactSection } from "../../contact/ui/contact-section";
import { CustomerBundlesSection } from "../../item/ui/customer-bundles-section";
import { loadCustomer } from "../load-customer";
import { CustomerActions } from "./customer-actions";
import { CustomerFacts } from "./customer-facts";

export type CustomerDetailProps = { locale: Locale; id: string };

/** Customer detail page body: facts with edit and archive, contact persons and bundles. */
export async function CustomerDetail({ locale, id }: CustomerDetailProps) {
  const common = await getTranslations("common");
  const abilities = await getCallerAbilities();
  const [customer, data] = await Promise.all([
    loadCustomer({ id }),
    loadTypedFormData({ base: "CUSTOMER" }),
  ]);
  if (!customer.ok) {
    return <ErrorState errorKey={handleLoadError({ error: customer.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const type = data.value.types.find(({ id: typeId }) => typeId === customer.value.entityTypeId);
  const canEdit = can({ abilities, permission: "customer:write" });
  const canArchive = can({ abilities, permission: "customer:delete" });
  const actions =
    canEdit || canArchive ? (
      <CustomerActions customer={customer.value} canEdit={canEdit} canArchive={canArchive} />
    ) : undefined;
  return (
    <div className="grid gap-6">
      <CrumbName href={customerRoute({ id })} name={customer.value.name} />
      <Link
        href={ROUTES.customers}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={customer.value.name} actions={actions} />
      <CustomerFacts
        customer={customer.value}
        type={type}
        vocabularies={data.value.vocabularies}
        links={data.value.links}
      />
      <DeferredSection>
        <ContactSection locale={locale} customerId={customer.value.id} />
      </DeferredSection>
      <DeferredSection>
        <CustomerBundlesSection locale={locale} customerId={customer.value.id} />
      </DeferredSection>
    </div>
  );
}
