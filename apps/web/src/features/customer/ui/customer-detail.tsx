import type { Locale } from "@bibi/i18n";
import { CrumbName } from "@/components/shell/crumb-name";
import { DeferredSection } from "@/components/states/deferred-section";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { customerRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { ContactSection } from "../../contact/ui/contact-section";
import { CustomerBundlesSection } from "../../item/ui/customer-bundles-section";
import { CustomerTaskSection } from "../../task/ui/customer-task-section";
import { loadCustomer } from "../load-customer";
import { CustomerActions } from "./customer-actions";
import { CustomerDangerArea } from "./customer-danger-area";
import { CustomerFacts } from "./customer-facts";

export type CustomerDetailProps = { locale: Locale; id: string };

/** Customer detail page body: facts, contact persons, tasks, bundles and the danger area. */
export async function CustomerDetail({ locale, id }: CustomerDetailProps) {
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
  const actions = canEdit ? <CustomerActions customer={customer.value} /> : undefined;
  return (
    <div className="grid gap-6">
      <CrumbName href={customerRoute({ id })} name={customer.value.name} />
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
        <CustomerTaskSection locale={locale} customerId={customer.value.id} />
      </DeferredSection>
      <DeferredSection>
        <CustomerBundlesSection locale={locale} customerId={customer.value.id} />
      </DeferredSection>
      {can({ abilities, permission: "customer:delete" }) ? (
        <CustomerDangerArea customer={customer.value} />
      ) : null}
    </div>
  );
}
