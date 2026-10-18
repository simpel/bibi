"use client";

import { useTranslations } from "next-intl";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { TypedWizard } from "@/components/wizard/typed-wizard";
import { ROUTES } from "@/lib/routes";
import { CustomerCoreFields } from "./customer-core-fields";
import { useCustomerForm } from "./use-customer-form";

export type CustomerWizardProps = { data: TypedFormData };

/** Create a customer step by step: type, name and invoicing details, then the type's own fields. */
export function CustomerWizard({ data }: CustomerWizardProps) {
  const t = useTranslations("customer.fields");
  const { form, run, pending, typeOf } = useCustomerForm({ data, onDone: () => undefined });
  return (
    <TypedWizard
      form={form}
      data={data}
      typeOf={typeOf}
      run={run}
      pending={pending}
      core={<CustomerCoreFields form={form} />}
      coreFields={[
        "name",
        "email",
        "phone",
        "invoiceStreetAddress",
        "invoicePostalCode",
        "invoiceCity",
        "invoiceCountry",
        "paymentTermsDays",
        "creditLimit",
      ]}
      typeLabel={t("type")}
      typeChosen={false}
      cancelHref={ROUTES.customers}
    />
  );
}
